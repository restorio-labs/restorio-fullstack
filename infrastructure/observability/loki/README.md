# Loki and Alloy releases

This directory defines the Grafana Loki and Grafana Alloy releases required by issue [#206](https://github.com/restorio-labs/restorio-fullstack/issues/206).
Loki uses one single-binary StatefulSet with a `local-path` 30 GiB `ReadWriteOnce` persistent volume.
It uses a filesystem-backed TSDB index, a 24-hour index period, and Compactor-managed 14-day retention.
The PersistentVolumeClaim remains after release deletion or scaling changes.

Alloy runs as a DaemonSet and read-only tails the kubelet-managed container-log files under `/var/log/pods` on every schedulable node.
It sends batches directly to the cluster-internal Loki service without Kafka, another broker, or an application-side logging client.
Alloy has no Kubernetes RBAC because static file tailing does not require Kubernetes API discovery.
The accepted Loki labels are `cluster`, `source`, `job`, `namespace`, and `container`.
Structured JSON fields stay in the log payload and must not be promoted to labels.

Loki, Alloy, and their metrics endpoints are cluster-internal only.
The NetworkPolicies allow only Alloy ingestion, Grafana queries, and Prometheus scrapes.
No Ingress, LoadBalancer service, or NodePort service is rendered.

The 30 GiB Loki volume has alert thresholds at 70, 85, and 95 percent usage.
The Platform overview Grafana dashboard shows volume utilization and a daily storage-growth series.
At 85 percent usage, reduce noisy log volume, shorten retention, or expand the volume before ingestion reaches the filesystem limit.

Git is the recovery source for the releases, values, NetworkPolicy, and alert rules.
If the Loki volume or its k3s node is unrecoverable, the initial architecture accepts loss of the retained logs and recreates the service from Git within the four-hour recovery objective defined in ADR 0002.

## Prerequisites

- Helm 3.20 or newer
- `kubectl` access to the target cluster
- The Prometheus release from issue #203
- The Grafana release from issue #204
- The structured JSON logging rollout from issue #205
- A default-compatible `local-path` storage class

## Validate

Run the manifest checks before applying either environment:

```bash
./infrastructure/observability/loki/validate.sh
```

The validation downloads both pinned chart archives, verifies their SHA-256 digests, renders staging and production, and verifies topology, resource ceilings, filesystem retention, low-cardinality log labels, direct Loki ingestion, service discovery, private access, retention of the PVC, and storage alerts.

## Deploy to staging

Select the staging kubeconfig explicitly before running the commands.

```bash
cd infrastructure/observability/loki
source ./chart.env

curl --fail --location --silent --show-error "$LOKI_CHART_ARCHIVE_URL" \
  --output "${LOKI_CHART_NAME}-${LOKI_CHART_VERSION}.tgz"
printf '%s  %s\n' "$LOKI_CHART_ARCHIVE_SHA256" "${LOKI_CHART_NAME}-${LOKI_CHART_VERSION}.tgz" | sha256sum --check

curl --fail --location --silent --show-error "$ALLOY_CHART_ARCHIVE_URL" \
  --output "${ALLOY_CHART_NAME}-${ALLOY_CHART_VERSION}.tgz"
printf '%s  %s\n' "$ALLOY_CHART_ARCHIVE_SHA256" "${ALLOY_CHART_NAME}-${ALLOY_CHART_VERSION}.tgz" | sha256sum --check

kubectl --namespace "$NAMESPACE" apply -f ./network-policy.yaml -f ./rules.yaml

helm upgrade --install "$LOKI_RELEASE_NAME" "${LOKI_CHART_NAME}-${LOKI_CHART_VERSION}.tgz" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values ./values.loki.yaml \
  --values ./values.staging.yaml \
  --atomic \
  --wait \
  --timeout 10m

helm upgrade --install "$ALLOY_RELEASE_NAME" "${ALLOY_CHART_NAME}-${ALLOY_CHART_VERSION}.tgz" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values ./values.alloy.yaml \
  --values ./values.staging.yaml \
  --atomic \
  --wait \
  --timeout 10m
```

Apply the updated Grafana release after Loki is ready so its Loki datasource is provisioned.
Use the pinned Grafana chart archive workflow in `../grafana/README.md` with the same environment.

## Deploy to production

Production deployment is allowed only after staging validation and an explicit kube-context check.
Use the same command sequence with `values.production.yaml` in both Helm releases.

## Runtime verification

Confirm that Loki, its persistent volume, Alloy on every node, scrape targets, and storage alerts are present:

```bash
kubectl --namespace observability get statefulset,pods,pvc,daemonset,servicemonitor,prometheusrule,networkpolicy
kubectl --namespace observability rollout status statefulset/loki --timeout=10m
kubectl --namespace observability rollout status daemonset/alloy --timeout=10m
```

Confirm an Alloy pod exposes a healthy metrics endpoint and its logs show successful pushes:

```bash
kubectl --namespace observability port-forward service/alloy 12345:12345
curl --fail http://127.0.0.1:12345/-/ready
kubectl --namespace observability logs daemonset/alloy --all-containers=true --tail=100
```

From the Grafana Explore view, select the `Loki` datasource and query `{cluster="restorio-staging", source="kubernetes"}`.
Create a controlled test log line in staging and confirm it appears, then delete the test workload.

## Rollback and recovery

List release revisions and roll back the failing release:

```bash
helm --namespace observability history loki
helm --namespace observability rollback loki REVISION --wait --timeout 10m
helm --namespace observability history alloy
helm --namespace observability rollback alloy REVISION --wait --timeout 10m
```

Do not delete the Loki PVC during a normal rollback.
If the PVC or its node is lost, recreate the Helm release and accept the loss of the local retained log window as defined by ADR 0002.
