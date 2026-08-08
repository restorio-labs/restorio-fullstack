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

- `DEPLOY_SSH_PRIVATE_KEY` - dedicated key restricted to the deployment command on the target VPS
- `GHCR_PULL_TOKEN` - GitHub token with read access to the Restorio container packages

Each environment needs these variables:

- `DEPLOY_SSH_HOST` - public SSH address of the target VPS
- `DEPLOY_SSH_PORT` - SSH port, normally `22`
- `DEPLOY_SSH_KNOWN_HOSTS` - pinned SSH host key for the target VPS

The k3s kubeconfig stays on the target VPS and is readable only by the local deployment account.
It must use a namespace-scoped ServiceAccount and must not use the k3s administrator kubeconfig.
This keeps the Kubernetes API private and prevents GitHub Actions from receiving cluster credentials.
Bootstrap the SSH deployment gateway using [`deploy/k3s/ci/README.md`](../../k3s/ci/README.md).

## Deploying a release

First publish the images from a `vMAJOR.MINOR.PATCH` tag through the `Publish OCI Images` workflow.
After both image jobs finish, run `Deploy to k3s` from the same tag and select `preview` or `production`.
The GitHub workflow resolves the released image tags to OCI digests and makes one constrained SSH deployment request to the target VPS.

The target verifies the release tag's commit before it checks out the Helm chart.
`helm upgrade --install --atomic --wait --wait-for-jobs` automatically rolls back the release when the migration job or an application readiness check fails.

## External Caddy routing

The chart exposes API traffic as NodePort `30081` in production and `31081` in preview.
The existing external Caddy instance must proxy `api.restorio.org` to the production node's `30081` endpoint.
Do not expose the Kubernetes API, Prometheus, Grafana, Loki, or internal services through this route.

When the optional public web workload is enabled, it uses NodePort `30080` in production.
Do not enable it while `restorio.org` is served by the existing Cloudflare Worker.
