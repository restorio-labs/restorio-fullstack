# Grafana release

This directory defines the Grafana release required by issue [#204](https://github.com/restorio-labs/restorio-fullstack/issues/204).
It uses the upstream Grafana chart pinned to an exact version and archive SHA-256 digest.

Grafana has one replica and a `local-path` persistent volume for its SQLite state, plugin metadata, and local configuration state.
Its Prometheus and Loki datasources and Platform overview dashboard are provisioned from reviewed files in this repository.
Dashboard changes are not editable through the Grafana UI.

The service is `ClusterIP` only.
Anonymous access is disabled and the admin credentials come from the `grafana-admin` Kubernetes Secret.
No public ingress is rendered until issue #150 supplies the approved TLS and identity layer required by ADR 0002.

## Prerequisites

- Helm 3.20 or newer
- `kubectl` access to the target cluster
- The Prometheus release from issue #203
- The Loki release from issue #206 before the Loki datasource is queried
- A default-compatible `local-path` storage class
- A `grafana-admin` Secret in the `observability` namespace with `admin-user` and `admin-password` keys

Create the administrator Secret through the platform secret-management process.
Do not commit the Secret or either credential to this repository.

## Validate

Run the manifest checks before applying either environment:

```bash
./infrastructure/observability/grafana/validate.sh
```

The validation downloads the pinned chart archive, verifies its SHA-256 digest, renders staging and production, and verifies the replica count, resources, persistence, cluster-only service, authentication settings, Prometheus datasource, dashboard provisioning, ServiceMonitor, environment labels, and absence of an Ingress or HPA.

## Deploy to staging

Select the staging kubeconfig explicitly before running the commands.

```bash
cd infrastructure/observability/grafana
source ./chart.env

curl --fail --location --silent --show-error "$CHART_ARCHIVE_URL" \
  --output "${CHART_NAME}-${CHART_VERSION}.tgz"
printf '%s  %s\n' "$CHART_ARCHIVE_SHA256" "${CHART_NAME}-${CHART_VERSION}.tgz" | sha256sum --check

kubectl --namespace "$NAMESPACE" apply -f ./dashboards/platform-overview.yaml

helm upgrade --install "$RELEASE_NAME" "${CHART_NAME}-${CHART_VERSION}.tgz" \
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
cd infrastructure/observability/grafana
source ./chart.env

kubectl config current-context

curl --fail --location --silent --show-error "$CHART_ARCHIVE_URL" \
  --output "${CHART_NAME}-${CHART_VERSION}.tgz"
printf '%s  %s\n' "$CHART_ARCHIVE_SHA256" "${CHART_NAME}-${CHART_VERSION}.tgz" | sha256sum --check

kubectl --namespace "$NAMESPACE" apply -f ./dashboards/platform-overview.yaml

helm upgrade --install "$RELEASE_NAME" "${CHART_NAME}-${CHART_VERSION}.tgz" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values ./values.yaml \
  --values ./values.production.yaml \
  --atomic \
  --wait \
  --timeout 10m
```

Remove the downloaded chart archive after deployment if it is no longer needed.

## Runtime verification

Confirm that Grafana, its PVC, the dashboard ConfigMap, and the ServiceMonitor are present:

```bash
kubectl --namespace observability get deployment,pods,pvc,configmap,servicemonitor
```

Check that anonymous requests cannot access the API and that the health endpoint is ready:

```bash
kubectl --namespace observability port-forward service/grafana 3000:80
curl --include http://127.0.0.1:3000/api/user
curl --fail http://127.0.0.1:3000/api/health
```

The first command must return `401 Unauthorized`.
Use the approved TLS and identity-protected ingress from issue #150 for browser login.

## Rollback

List release revisions and roll back to the last known-good revision:

```bash
helm --namespace observability history grafana
helm --namespace observability rollback grafana REVISION --wait --timeout 10m
```

The persistent volume and externally managed admin Secret are not deleted by a Helm rollback.
Do not delete the PVC during a normal rollback.
