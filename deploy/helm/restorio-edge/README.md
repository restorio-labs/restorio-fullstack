# Restorio edge chart

`restorio-edge` is the public Nginx boundary for a single-node k3s environment.
It owns the two Mikr.us forwarded ports through `hostNetwork`:

- `20122` receives HTTP origin traffic
- `30122` receives HTTPS origin traffic

The chart routes traffic to loopback-only k3s NodePorts.
It terminates Cloudflare Origin TLS and enforces Basic Auth for every `preview-*` application and API hostname.
The TLS certificate and Basic Auth file are deliberately external Kubernetes Secrets, never Helm values or repository files.

## Required Secrets

Create these secrets in the target namespace before deploying the chart:

```bash
k3s kubectl --namespace restorio create secret generic restorio-edge-tls \
  --from-file=cert.pem=/path/to/cert.pem \
  --from-file=key.pem=/path/to/key.pem

k3s kubectl --namespace restorio create secret generic restorio-preview-basic-auth \
  --from-file=htpasswd=/path/to/htpasswd
```

The deployment service account can read the secret metadata that Helm requires, but it cannot read their values through GitHub Actions.

## Preview cutover from Docker Compose

The first preview deployment needs a short edge-only maintenance window because Docker Nginx currently owns ports `20122` and `30122`.

1. Update `/usr/local/libexec/restorio-preview-deploy` from the merged repository version.
2. Create the two Kubernetes Secrets from the legacy Nginx files.
3. Stop and remove only the legacy `restorio-nginx` container.
4. Trigger the `Deploy to k3s` workflow for the release tag containing this chart.
5. Verify `https://preview-admin.restorio.org/`, `https://preview-api.restorio.org/docs`, and the other preview hosts.
6. Remove the remaining legacy Docker Compose containers and then `/root/restorio-fullstack`.

The deployment script installs this chart before updating runtime dependencies and application workloads, so the public edge returns first.
