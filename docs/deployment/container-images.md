# Container images

Issue [#148](https://github.com/restorio-labs/restorio-fullstack/issues/148) defines the immutable image supply chain for self-hosted Restorio components.

## Published components

The `Publish Release OCI Images` workflow publishes these repositories to GitHub Container Registry from a `vMAJOR.MINOR.PATCH` release tag:

| Component | Image |
|---|---|
| API | `ghcr.io/restorio-labs/restorio-api` |
| Admin panel | `ghcr.io/restorio-labs/restorio-admin-panel` |
| Kitchen panel | `ghcr.io/restorio-labs/restorio-kitchen-panel` |
| Mobile app | `ghcr.io/restorio-labs/restorio-mobile-app` |
| Waiter panel | `ghcr.io/restorio-labs/restorio-waiter-panel` |

`public-web` is not published as a container because ADR 0001 assigns it to Cloudflare Workers.
`ui-demo` is not a production component.

## Artifact identity

Every release publishes the release version and `sha-<full-commit-sha>`.
Release configuration must resolve a tag to the digest emitted by the workflow and store the full `image@sha256:...` reference.
Production deployment must never select `latest` or another mutable tag.

The workflow adds OCI source, version, revision, and creation labels.
BuildKit also publishes provenance and SBOM attestations for the digest.
Trivy scans the pushed digest and fails on unfixed high or critical vulnerabilities.

## Runtime guarantees

The API runs as UID and GID `10001` without development reload behavior.
Static frontends run on the unprivileged Nginx image as UID and GID `101` and listen on port `8080`.
All images include a container health check and can run without mounting the source repository.

The four static frontends use `/api/v1` as a same-origin API base.
The external reverse proxy routes `/api` and WebSocket traffic to the API before routing the frontend catch-all path to a static frontend NodePort.

## Local verification

Build the API image:

```bash
docker build \
  --build-arg BUILD_DATE=1970-01-01T00:00:00Z \
  --build-arg VCS_REF=local \
  --build-arg VERSION=0.1.0 \
  --file app/api/Dockerfile \
  --tag restorio-api:local \
  app/api
```

Build a frontend image:

```bash
docker build \
  --build-arg VCS_REF=local \
  --build-arg VERSION=1.0.0 \
  --file app/apps/admin-panel/Dockerfile \
  --tag restorio-admin-panel:local \
  .
```

Run a published image by digest:

```bash
docker run --rm -p 8080:8080 ghcr.io/restorio-labs/restorio-admin-panel@sha256:<digest>
```

Image builds require registry and package-index network access.
No production deployment workflow may copy application source or built frontend directories to a server with `rsync` or `scp`.
