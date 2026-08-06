#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
source "$SCRIPT_DIR/chart.env"

HELM_BIN=${HELM_BIN:-helm}

if ! command -v "$HELM_BIN" >/dev/null 2>&1; then
  echo "Helm is required to validate the Loki and Alloy releases" >&2
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

verify_chart() {
  local archive=$1
  local checksum=$2
  local name=$3
  local version=$4
  local metadata="$TEMP_DIR/$name-metadata.yaml"

  printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check --status
  "$HELM_BIN" show chart "$archive" > "$metadata"
  assert_contains "$metadata" "^name: $name$" "Unexpected Helm chart name"
  assert_contains "$metadata" "^version: $version$" "Unexpected Helm chart version"
}

validate_environment() {
  local environment=$1
  local expected_cluster=$2
  local loki_rendered="$TEMP_DIR/loki-$environment.yaml"
  local alloy_rendered="$TEMP_DIR/alloy-$environment.yaml"
  local loki_statefulset="$TEMP_DIR/loki-$environment-statefulset.yaml"
  local loki_config="$TEMP_DIR/loki-$environment-config.yaml"
  local loki_service="$TEMP_DIR/loki-$environment-service.yaml"
  local loki_monitor="$TEMP_DIR/loki-$environment-monitor.yaml"
  local alloy_daemonset="$TEMP_DIR/alloy-$environment-daemonset.yaml"
  local alloy_config="$TEMP_DIR/alloy-$environment-config.yaml"
  local alloy_monitor="$TEMP_DIR/alloy-$environment-monitor.yaml"
  local alloy_policy="$TEMP_DIR/alloy-$environment-policy.yaml"

  "$HELM_BIN" template "$LOKI_RELEASE_NAME" "$TEMP_DIR/$LOKI_CHART_NAME-$LOKI_CHART_VERSION.tgz" \
    --namespace "$NAMESPACE" \
    --api-versions monitoring.coreos.com/v1/ServiceMonitor \
    --values "$SCRIPT_DIR/values.loki.yaml" \
    --values "$SCRIPT_DIR/values.$environment.yaml" \
    > "$loki_rendered"

  "$HELM_BIN" template "$ALLOY_RELEASE_NAME" "$TEMP_DIR/$ALLOY_CHART_NAME-$ALLOY_CHART_VERSION.tgz" \
    --namespace "$NAMESPACE" \
    --api-versions monitoring.coreos.com/v1/ServiceMonitor \
    --values "$SCRIPT_DIR/values.alloy.yaml" \
    --values "$SCRIPT_DIR/values.$environment.yaml" \
    > "$alloy_rendered"

  extract_resource "$loki_rendered" StatefulSet "$loki_statefulset"
  extract_resource "$loki_rendered" ConfigMap "$loki_config"
  extract_resource "$loki_rendered" Service "$loki_service"
  extract_resource "$loki_rendered" ServiceMonitor "$loki_monitor"
  extract_resource "$alloy_rendered" DaemonSet "$alloy_daemonset"
  extract_resource "$alloy_rendered" ConfigMap "$alloy_config"
  extract_resource "$alloy_rendered" ServiceMonitor "$alloy_monitor"
  extract_resource "$alloy_rendered" NetworkPolicy "$alloy_policy"

  assert_contains "$loki_statefulset" '^  replicas: 1$' "Loki must render one single-binary replica for $environment"
  assert_contains "$loki_statefulset" '^[[:space:]]+cpu: 250m$' "Loki CPU request is missing"
  assert_contains "$loki_statefulset" '^[[:space:]]+memory: 512Mi$' "Loki memory request is missing"
  assert_contains "$loki_statefulset" '^[[:space:]]+cpu: "?1"?$' "Loki CPU limit is missing"
  assert_contains "$loki_statefulset" '^[[:space:]]+memory: 2Gi$' "Loki memory limit is missing"
  assert_contains "$loki_statefulset" '^[[:space:]]+storageClassName: local-path$' "Loki must use the k3s local-path storage class"
  assert_contains "$loki_statefulset" '^[[:space:]]+- ReadWriteOnce$' "Loki must use ReadWriteOnce storage"
  assert_contains "$loki_statefulset" '^[[:space:]]+storage: "?30Gi"?$' "Loki must request a 30Gi persistent volume"
  assert_contains "$loki_config" '^      retention_enabled: true$' "Loki Compactor retention must be enabled"
  assert_contains "$loki_config" '^      retention_period: 336h$' "Loki retention must be 14 days"
  assert_contains "$loki_config" '^      delete_request_store: filesystem$' "Loki retention markers must use filesystem storage"
  assert_contains "$loki_config" '^      working_directory: /var/loki/retention$' "Loki Compactor work directory must use the persistent volume"
  assert_contains "$loki_config" '^        object_store: filesystem$' "Loki must use filesystem storage"
  assert_contains "$loki_config" '^          period: 24h$' "Loki TSDB index period must be 24 hours"
  assert_contains "$loki_config" '^      per_stream_rate_limit: 3MB$' "Loki per-stream ingestion limit is missing"
  assert_contains "$loki_config" '^      per_stream_rate_limit_burst: 6MB$' "Loki per-stream ingestion burst limit is missing"
  assert_contains "$loki_service" '^[[:space:]]+type: ClusterIP$' "Loki must remain cluster-internal"
  assert_contains "$loki_monitor" 'restorio.io/prometheus: primary' "Loki ServiceMonitor discovery label is missing"
  assert_not_contains "$loki_rendered" '^kind: Ingress$' "Loki must not render a public ingress"
  assert_not_contains "$loki_rendered" '^kind: HorizontalPodAutoscaler$' "Loki must not render an HPA"
  assert_not_contains "$loki_rendered" '^kind: Deployment$' "Loki must use the single-binary StatefulSet topology"

  assert_contains "$alloy_daemonset" '^kind: DaemonSet$' "Alloy must run as a DaemonSet"
  assert_contains "$alloy_daemonset" '^[[:space:]]+path: /var/log$' "Alloy must mount Kubernetes container logs from every node"
  assert_contains "$alloy_daemonset" '^[[:space:]]+mountPath: /var/log$' "Alloy must expose host logs at /var/log"
  assert_contains "$alloy_daemonset" '^[[:space:]]+readOnly: true$' "Alloy host log mount must be read-only"
  assert_contains "$alloy_daemonset" '^[[:space:]]+cpu: 90m$' "Alloy CPU request is missing"
  assert_contains "$alloy_daemonset" '^[[:space:]]+memory: 96Mi$' "Alloy memory request is missing"
  assert_contains "$alloy_daemonset" '^[[:space:]]+cpu: 400m$' "Alloy CPU limit is missing"
  assert_contains "$alloy_daemonset" '^[[:space:]]+memory: 384Mi$' "Alloy memory limit is missing"
  assert_contains "$alloy_daemonset" '^[[:space:]]+cpu: 10m$' "Alloy reloader CPU request is missing"
  assert_contains "$alloy_daemonset" '^[[:space:]]+memory: 32Mi$' "Alloy reloader memory request is missing"
  assert_contains "$alloy_daemonset" '^[[:space:]]+cpu: 100m$' "Alloy reloader CPU limit is missing"
  assert_contains "$alloy_daemonset" '^[[:space:]]+memory: 128Mi$' "Alloy reloader memory limit is missing"
  assert_contains "$alloy_config" '__path__ = "/var/log/pods/\*/\*/\*\.log"' "Alloy must tail Kubernetes container logs"
  assert_contains "$alloy_config" "cluster = \"$expected_cluster\"" "Alloy cluster label is missing"
  assert_contains "$alloy_config" 'url = "http://loki\.observability\.svc\.cluster\.local:3100/loki/api/v1/push"' "Alloy must push directly to Loki"
  assert_contains "$alloy_config" 'max_backoff_retries = 10' "Alloy must bound failed-delivery retries"
  assert_contains "$alloy_monitor" 'restorio.io/prometheus: primary' "Alloy ServiceMonitor discovery label is missing"
  assert_contains "$alloy_policy" 'app.kubernetes.io/name: loki' "Alloy NetworkPolicy must allow Loki ingestion only"
  assert_not_contains "$alloy_rendered" '^kind: Ingress$' "Alloy must not render a public ingress"
  assert_not_contains "$alloy_rendered" '^kind: HorizontalPodAutoscaler$' "Alloy must not render an HPA"
  assert_not_contains "$alloy_rendered" '^kind: ClusterRole$' "Static file tailing must not grant Alloy Kubernetes discovery permissions"

  echo "Validated Loki and Alloy manifests for $environment"
}

loki_archive="$TEMP_DIR/$LOKI_CHART_NAME-$LOKI_CHART_VERSION.tgz"
alloy_archive="$TEMP_DIR/$ALLOY_CHART_NAME-$ALLOY_CHART_VERSION.tgz"

curl --fail --location --silent --show-error "$LOKI_CHART_ARCHIVE_URL" --output "$loki_archive"
curl --fail --location --silent --show-error "$ALLOY_CHART_ARCHIVE_URL" --output "$alloy_archive"

verify_chart "$loki_archive" "$LOKI_CHART_ARCHIVE_SHA256" "$LOKI_CHART_NAME" "$LOKI_CHART_VERSION"
verify_chart "$alloy_archive" "$ALLOY_CHART_ARCHIVE_SHA256" "$ALLOY_CHART_NAME" "$ALLOY_CHART_VERSION"

assert_contains "$SCRIPT_DIR/values.loki.yaml" '^    whenScaled: Retain$' "Loki PVC must survive scaling changes"
assert_contains "$SCRIPT_DIR/values.loki.yaml" '^    whenDeleted: Retain$' "Loki PVC must survive release deletion"
assert_contains "$SCRIPT_DIR/values.loki.yaml" '^    enableStatefulSetAutoDeletePVC: false$' "Loki PVC auto-deletion must remain disabled"
assert_contains "$SCRIPT_DIR/network-policy.yaml" '^kind: NetworkPolicy$' "Loki must have an ingress NetworkPolicy"
assert_contains "$SCRIPT_DIR/network-policy.yaml" 'app.kubernetes.io/name: alloy' "Loki NetworkPolicy must allow Alloy ingestion"
assert_contains "$SCRIPT_DIR/network-policy.yaml" 'app.kubernetes.io/name: grafana' "Loki NetworkPolicy must allow Grafana queries"
assert_contains "$SCRIPT_DIR/rules.yaml" '^kind: PrometheusRule$' "Loki storage alerts must be a PrometheusRule"
assert_contains "$SCRIPT_DIR/rules.yaml" '> 0.70' "Loki storage warning threshold is missing"
assert_contains "$SCRIPT_DIR/rules.yaml" '> 0.85' "Loki storage critical threshold is missing"
assert_contains "$SCRIPT_DIR/rules.yaml" '> 0.95' "Loki storage exhaustion threshold is missing"

validate_environment staging restorio-staging
validate_environment production restorio-production
