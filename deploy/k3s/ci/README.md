# Restorio k3s deployment gateway

The GitHub workflow runs on a GitHub-hosted runner and connects through SSH to a dedicated deployment account on the target VPS.
Kubernetes API access and the service-account kubeconfig never leave the VPS.
Do not install a self-hosted GitHub Actions runner on this public repository.

## Preview bootstrap

Run the following commands as root on the preview VPS after the deployment change is merged.
The commands create a non-interactive `restorio-deploy` account and an RBAC identity constrained to the `restorio` namespace.

```bash
id -u restorio-deploy >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/restorio-deploy --shell /bin/bash restorio-deploy
install -d -o restorio-deploy -g restorio-deploy -m 0700 /var/lib/restorio-deploy/.ssh
install -d -o root -g restorio-deploy -m 0750 /etc/restorio-deploy
```

Apply `restorio-deployer-rbac.yaml` into the target namespace and create a kubeconfig for `restorio-deploy` at `/etc/restorio-deploy/kubeconfig`.
The file must be owned by `root:restorio-deploy` with mode `0640`.
Create a new `restorio-deployer-token` whenever creating that kubeconfig.

Install the checked-in command as root:

```bash
install -d -o root -g root -m 0755 /usr/local/libexec
install -o root -g root -m 0755 deploy/k3s/ci/restorio-preview-deploy /usr/local/libexec/restorio-preview-deploy
```

The deploy account needs Helm and kubectl in its `PATH`.
Use the k3s-provided `kubectl` and install a current Helm 3 binary with its published SHA-256 checksum.

Create `/etc/restorio-deploy/preview.env` as `root:restorio-deploy`, mode `0640`:

```dotenv
K3S_NAMESPACE=restorio
GHCR_USERNAME=restorio-labs
GHCR_PULL_TOKEN=REPLACE_WITH_A_READ_ONLY_GHCR_TOKEN
```

Do not store this token in the repository or paste it into chat.

## SSH restriction

Generate a dedicated ED25519 key pair for the GitHub Environment.
Place its public key in `/var/lib/restorio-deploy/.ssh/authorized_keys` as a single line prefixed with:

```text
command="/usr/local/libexec/restorio-preview-deploy",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty
```

The forced command accepts only `deploy VERSION COMMIT API_DIGEST ADMIN_PANEL_DIGEST KITCHEN_PANEL_DIGEST MOBILE_APP_DIGEST WAITER_PANEL_DIGEST` and validates every argument.
The key cannot open an interactive shell, tunnel ports, or execute arbitrary commands.
Only one preview deployment can run at a time.
If an earlier deployment still owns the VPS lock, the newer workflow fails with an instruction to wait and select **Re-run failed jobs**.
The gateway keeps a sparse checkout containing only `deploy/` because pods run immutable OCI images and do not need the application source tree.

## GitHub Environment

For the `preview` Environment, configure:

- Variable `DEPLOY_SSH_HOST` with the public address of the preview VPS
- Variable `DEPLOY_SSH_PORT` with the SSH port, normally `22`
- Variable `DEPLOY_SSH_KNOWN_HOSTS` with the output of `ssh-keyscan -H -p 22 YOUR_HOST`
- Secret `DEPLOY_SSH_PRIVATE_KEY` with the dedicated private key
- Secret `GHCR_PULL_TOKEN` with read-only access to the Restorio packages

Do not configure `KUBECONFIG_B64`.
Use required reviewers for the production Environment.
