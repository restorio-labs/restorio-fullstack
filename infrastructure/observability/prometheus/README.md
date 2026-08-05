# Prometheus release

This directory defines the Prometheus release required by issue [#203](https://github.com/restorio-labs/restorio-fullstack/issues/203).
It uses the upstream `kube-prometheus-stack` chart pinned by OCI digest.

The release intentionally contains Prometheus and Prometheus Operator only.
Grafana, Alertmanager, kube-state-metrics, node-exporter, Thanos, remote write, and autoscaling remain disabled because they belong to separate tickets or are excluded by ADR 0002.

## Prerequisites

- Helm 3.20 or newer
- A reachable k3s cluster
- A default-compatible `local-path` storage class
- Cluster-admin access for the initial CRD installation

## Validate

Run the manifest checks before applying either environment:

```bash
./infrastructure/observability/prometheus/validate.sh
```

The validation renders both environments and verifies the chart identity, replicas, shards, retention, PVC, resource limits, target discovery, self-monitoring, disabled components, internal-only access, and absence of an HPA.

## Target discovery contract

Prometheus watches `ServiceMonitor`, `PodMonitor`, `Probe`, `ScrapeConfig`, and `PrometheusRule` resources across namespaces, but selects only resources carrying this label:

```yaml
restorio.io/prometheus: primary
```

The chart applies the label to the Kubernetes API server, kubelet, CoreDNS, Prometheus Operator, and Prometheus self-monitoring targets.
Future application and exporter tickets must apply the same label to opt their monitoring resources into this Prometheus instance.

## Deploy to staging

Select the staging kubeconfig explicitly before running the command.

```bash
cd infrastructure/observability/prometheus
source ./chart.env

helm upgrade --install "$RELEASE_NAME" "$CHART_REFERENCE" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values ./values.yaml \
  --values ./values.staging.yaml \
  --atomic \
  --wait \
  --timeout 10m
```

## Deploy to production

Production deployment is allowed only after staging validation and an explicit kube-context check.

```bash
cd infrastructure/observability/prometheus
source ./chart.env

kubectl config current-context

helm upgrade --install "$RELEASE_NAME" "$CHART_REFERENCE" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values ./values.yaml \
  --values ./values.production.yaml \
  --atomic \
  --wait \
  --timeout 10m
```

## Runtime verification

Verify that one Prometheus pod becomes ready and that its PVC remains bound:

```bash
kubectl --namespace observability get prometheus,pods,pvc
```

Verify discovered targets through a temporary local port forward:

```bash
kubectl --namespace observability port-forward service/prometheus-kube-prometheus-prometheus 9090:9090
```

Open `http://127.0.0.1:9090/targets` and confirm that Prometheus, Prometheus Operator, the Kubernetes API server, kubelet, and CoreDNS targets are healthy.
The Prometheus service is a `ClusterIP` and no Ingress is rendered.

Restart the Prometheus pod and verify that the replacement pod reuses the same bound claim and retains recent samples:

```bash
kubectl --namespace observability delete pod prometheus-prometheus-kube-prometheus-prometheus-0
kubectl --namespace observability wait \
  --for=condition=Ready \
  pod/prometheus-prometheus-kube-prometheus-prometheus-0 \
  --timeout=5m
kubectl --namespace observability get pvc
```

## Rollback

List release revisions and roll back to the last known-good revision:

```bash
helm --namespace observability history prometheus
helm --namespace observability rollback prometheus REVISION --wait --timeout 10m
```

The Prometheus custom resource retains its PVC when the StatefulSet is scaled or deleted.
Do not delete the PVC during a normal rollback.
