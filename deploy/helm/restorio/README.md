# Restorio k3s chart

This chart deploys the Restorio API and an optional self-hosted public web workload to a single-node k3s cluster.
It does not deploy PostgreSQL, MongoDB, MinIO, TLS, ingress, or observability.
Those resources have their own platform tickets and must exist before a production deployment.

The API image digest is required.
The public web digest is required only when `publicWeb.enabled` is true.
The chart runs Alembic as a Helm pre-install and pre-upgrade job before the API Deployment rolls out.

## GitHub environment configuration

Create the `preview` and `production` GitHub Environments.
Each environment needs these secrets:

- `KUBECONFIG_B64` - base64-encoded kubeconfig for a namespace-scoped CI ServiceAccount
- `GHCR_PULL_TOKEN` - GitHub token with read access to the Restorio container packages

Each environment may define `K3S_NAMESPACE` as a GitHub Environment variable.
It defaults to `restorio`.

The kubeconfig identity needs only the namespace permissions required by the workflow.
It must not use the k3s administrator kubeconfig.

## Deploying a release

First publish the images from a `vMAJOR.MINOR.PATCH` tag through the `Publish OCI Images` workflow.
After both image jobs finish, run `Deploy to k3s` from the same tag and select `preview` or `production`.
The workflow resolves the released image tags to OCI digests and passes only those digests to Helm.

`helm upgrade --install --atomic --wait --wait-for-jobs` automatically rolls back the release when the migration job or an application readiness check fails.

## External Caddy routing

The chart exposes API traffic as NodePort `30081` in production and `31081` in preview.
The existing external Caddy instance must proxy `api.restorio.org` to the production node's `30081` endpoint.
Do not expose the Kubernetes API, Prometheus, Grafana, Loki, or internal services through this route.

When the optional public web workload is enabled, it uses NodePort `30080` in production.
Do not enable it while `restorio.org` is served by the existing Cloudflare Worker.
