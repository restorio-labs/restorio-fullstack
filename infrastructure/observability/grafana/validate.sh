#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
source "$SCRIPT_DIR/chart.env"

HELM_BIN=${HELM_BIN:-helm}

if ! command -v "$HELM_BIN" >/dev/null 2>&1; then
  echo "Helm is required to validate the Grafana release" >&2
  exit 1
fi

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

assert_contains() {
  local file=$1
  local pattern=$2
  local message=$3

  if ! grep -Eq -- "$pattern" "$file"; then
    echo "$message" >&2
    exit 1
  fi
}

assert_not_contains() {
  local file=$1
  local pattern=$2
  local message=$3

  if grep -Eq -- "$pattern" "$file"; then
    echo "$message" >&2
    exit 1
  fi
}

extract_resource() {
  local source=$1
  local kind=$2
  local target=$3

  awk -v expected_kind="$kind" '
    BEGIN { RS = "---" }
    $0 ~ "(^|\\n)kind: " expected_kind "(\\n|$)" { print }
  ' "$source" > "$target"
}

validate_environment() {
  local environment=$1
  local rendered="$TEMP_DIR/$environment.yaml"
  local deployment="$TEMP_DIR/$environment-deployment.yaml"
  local pvc="$TEMP_DIR/$environment-pvc.yaml"
  local service="$TEMP_DIR/$environment-service.yaml"
  local service_monitor="$TEMP_DIR/$environment-service-monitor.yaml"
  local config_map="$TEMP_DIR/$environment-config-map.yaml"

  "$HELM_BIN" template "$RELEASE_NAME" "$TEMP_DIR/$CHART_NAME-$CHART_VERSION.tgz" \
    --namespace "$NAMESPACE" \
    --values "$SCRIPT_DIR/values.yaml" \
    --values "$SCRIPT_DIR/values.$environment.yaml" \
    > "$rendered"

  extract_resource "$rendered" Deployment "$deployment"
  extract_resource "$rendered" PersistentVolumeClaim "$pvc"
  extract_resource "$rendered" Service "$service"
  extract_resource "$rendered" ServiceMonitor "$service_monitor"
  extract_resource "$rendered" ConfigMap "$config_map"

  assert_contains "$deployment" '^  replicas: 1$' "Grafana must render exactly one replica for $environment"
  assert_contains "$deployment" '^[[:space:]]+cpu: 100m$' "Grafana CPU request is missing"
  assert_contains "$deployment" '^[[:space:]]+memory: 128Mi$' "Grafana memory request is missing"
  assert_contains "$deployment" '^[[:space:]]+cpu: 500m$' "Grafana CPU limit is missing"
  assert_contains "$deployment" '^[[:space:]]+memory: 512Mi$' "Grafana memory limit is missing"
  assert_contains "$deployment" '^[[:space:]]+name: grafana-admin$' "Grafana must use the externally managed admin secret"
  assert_contains "$deployment" "^[[:space:]]+restorio.org/environment: $environment$" "Grafana environment label is missing"

  assert_contains "$pvc" '^[[:space:]]+storageClassName: local-path$' "Grafana must use the k3s local-path storage class"
  assert_contains "$pvc" '^[[:space:]]+- "?ReadWriteOnce"?$' "Grafana must use ReadWriteOnce storage"
  assert_contains "$pvc" '^[[:space:]]+storage: "?5Gi"?$' "Grafana PVC must request 5Gi"

  assert_contains "$service" '^[[:space:]]+type: ClusterIP$' "Grafana must remain cluster-internal"
  assert_contains "$service_monitor" 'restorio.io/prometheus: primary' "Grafana ServiceMonitor discovery label is missing"
  assert_contains "$config_map" '^    \[auth.anonymous\]$' "Grafana anonymous-auth configuration is missing"
  assert_contains "$config_map" '^    enabled = false$' "Grafana anonymous access must be disabled"
  assert_contains "$config_map" '^    cookie_secure = true$' "Grafana secure cookies must be enabled"
  assert_contains "$rendered" 'prometheus-kube-prometheus-prometheus.observability.svc.cluster.local:9090' "Prometheus datasource is missing"
  assert_contains "$rendered" 'loki.observability.svc.cluster.local:3100' "Loki datasource is missing"
  assert_contains "$rendered" 'grafana-dashboard-platform-overview' "Repository dashboard ConfigMap is not provisioned"
  assert_not_contains "$rendered" '^kind: Ingress$' "Grafana ingress requires the platform TLS and identity layer"
  assert_not_contains "$rendered" '^kind: HorizontalPodAutoscaler$' "Grafana must not render an HPA"

  echo "Validated Grafana manifests for $environment"
}

chart_archive="$TEMP_DIR/$CHART_NAME-$CHART_VERSION.tgz"
curl --fail --location --silent --show-error "$CHART_ARCHIVE_URL" --output "$chart_archive"
printf '%s  %s\n' "$CHART_ARCHIVE_SHA256" "$chart_archive" | sha256sum --check --status

chart_metadata="$TEMP_DIR/chart-metadata.yaml"
"$HELM_BIN" show chart "$chart_archive" > "$chart_metadata"
assert_contains "$chart_metadata" "^name: $CHART_NAME$" "Unexpected Helm chart name"
assert_contains "$chart_metadata" "^version: $CHART_VERSION$" "Unexpected Helm chart version"

dashboard_json=$(awk 'found { sub(/^    /, ""); print } /^  platform-overview.json: \|$/ { found = 1 }' "$SCRIPT_DIR/dashboards/platform-overview.yaml")
printf '%s\n' "$dashboard_json" | jq --exit-status . >/dev/null

validate_environment staging
validate_environment production
