#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
source "$SCRIPT_DIR/chart.env"

HELM_BIN=${HELM_BIN:-helm}

if ! command -v "$HELM_BIN" >/dev/null 2>&1; then
  echo "Helm is required to validate the Prometheus release" >&2
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
  local expected_retention=$2
  local expected_retention_size=$3
  local expected_storage=$4
  local rendered="$TEMP_DIR/$environment.yaml"
  local prometheus_resource="$TEMP_DIR/$environment-prometheus.yaml"

  "$HELM_BIN" template "$RELEASE_NAME" "$CHART_REFERENCE" \
    --namespace "$NAMESPACE" \
    --values "$SCRIPT_DIR/values.yaml" \
    --values "$SCRIPT_DIR/values.$environment.yaml" \
    > "$rendered"

  extract_resource "$rendered" Prometheus "$prometheus_resource"

  assert_contains "$prometheus_resource" '^  replicas: 1$' "Prometheus must render exactly one replica for $environment"
  assert_contains "$prometheus_resource" '^  shards: 1$' "Prometheus must render exactly one shard for $environment"
  assert_contains "$prometheus_resource" "^  retention: \"?$expected_retention\"?$" "Unexpected retention for $environment"
  assert_contains "$prometheus_resource" "^  retentionSize: \"?$expected_retention_size\"?$" "Unexpected retention size for $environment"
  assert_contains "$prometheus_resource" "^[[:space:]]+storage: $expected_storage$" "Unexpected persistent volume size for $environment"
  assert_contains "$prometheus_resource" '^[[:space:]]+storageClassName: local-path$' "Prometheus must use the k3s local-path storage class"
  assert_contains "$prometheus_resource" '^[[:space:]]+- ReadWriteOnce$' "Prometheus must use ReadWriteOnce storage"
  assert_contains "$prometheus_resource" '^[[:space:]]+cpu: 250m$' "Prometheus CPU request is missing"
  assert_contains "$prometheus_resource" '^[[:space:]]+memory: 1Gi$' "Prometheus memory request is missing"
  assert_contains "$prometheus_resource" '^[[:space:]]+cpu: "?1"?$' "Prometheus CPU limit is missing"
  assert_contains "$prometheus_resource" '^[[:space:]]+memory: 2Gi$' "Prometheus memory limit is missing"
  assert_contains "$prometheus_resource" '^    whenDeleted: Retain$' "Prometheus PVC must survive release deletion"
  assert_contains "$prometheus_resource" '^    whenScaled: Retain$' "Prometheus PVC must survive scaling changes"
  assert_contains "$prometheus_resource" "^    environment: $environment$" "Prometheus environment label is missing"
  assert_not_contains "$prometheus_resource" '^  remoteWrite:' "Remote write is outside #203"
  assert_not_contains "$prometheus_resource" '^  thanos:' "Thanos is outside #203"

  assert_not_contains "$rendered" '^kind: HorizontalPodAutoscaler$' "The release must not render an HPA"
  assert_not_contains "$rendered" '^kind: Ingress$' "Prometheus must not have a public ingress"
  assert_not_contains "$rendered" '^kind: Alertmanager$' "Alertmanager is outside #203"
  assert_not_contains "$rendered" 'app.kubernetes.io/name: grafana' "Grafana is outside #203"
  assert_not_contains "$rendered" 'app.kubernetes.io/name: kube-state-metrics' "kube-state-metrics is outside #203"
  assert_not_contains "$rendered" 'app.kubernetes.io/name: prometheus-node-exporter' "node-exporter is outside #203"

  assert_contains "$rendered" '^kind: ServiceMonitor$' "The release must render Kubernetes target discovery"
  assert_contains "$rendered" 'restorio.io/prometheus: primary' "ServiceMonitor discovery label is missing"
  assert_contains "$rendered" 'app: kube-prometheus-stack-prometheus$' "Prometheus self-monitoring target is missing"

  echo "Validated Prometheus manifests for $environment"
}

chart_metadata="$TEMP_DIR/chart-metadata.yaml"
"$HELM_BIN" show chart "$CHART_REFERENCE" > "$chart_metadata"
assert_contains "$chart_metadata" "^name: $CHART_NAME$" "Unexpected Helm chart name"
assert_contains "$chart_metadata" "^version: $CHART_VERSION$" "Unexpected Helm chart version"

validate_environment staging 7d 12GB 15Gi
validate_environment production 15d 24GB 30Gi
