# Restorio k3s chart

This chart deploys the Restorio API and the four static application frontends to a single-node k3s cluster.
It does not deploy PostgreSQL, MongoDB, MinIO, TLS, the public web frontend, ingress, or observability.
Those resources have their own platform tickets and must exist before a production deployment.

Every workload image digest is required.
The public web frontend remains deployed to Cloudflare and is not part of this chart.
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

First publish the changed images from a `vMAJOR.MINOR.PATCH` tag through the `Publish Release OCI Images` workflow.
After its selected component jobs finish, run `Deploy to k3s` from the same tag and select `preview` or `production`.
The GitHub workflow resolves each component to the digest released by that tag or, when unchanged, to its latest earlier immutable digest.
It records that complete set in a release manifest attached to the GitHub Release.
`Deploy to k3s` downloads the manifest and makes one constrained SSH deployment request to the target VPS.

The target verifies the release tag's commit before it checks out the Helm chart.
`helm upgrade --install --atomic --wait --wait-for-jobs` automatically rolls back the release when the migration job or an application readiness check fails.

## External Caddy routing

The chart exposes API traffic as NodePort `30081` in production and `31081` in preview.
The existing external Caddy instance must proxy `api.restorio.org` to the production node's `30081` endpoint.
Do not expose the Kubernetes API, Prometheus, Grafana, Loki, or internal services through this route.

The static frontend services use NodePorts `30082` through `30085` in production and `31082` through `31085` in preview.
The existing external reverse proxy routes the panel hostnames to those NodePorts.
