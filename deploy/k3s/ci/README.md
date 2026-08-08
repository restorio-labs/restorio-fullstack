# Restorio k3s deployment runner

Each k3s node runs one GitHub Actions self-hosted runner.
The preview runner has the `restorio-preview` label and the production runner has the `restorio-production` label.
The deployment workflow selects its node through that label.
No Kubernetes API port is exposed to the internet.

## Bootstrap the Kubernetes identity

Run the following on the target VPS as root after checking out the repository.
Set `K3S_NAMESPACE` to the same namespace configured in the matching GitHub Environment.

Create the unprivileged system account that will run the deployment runner:

```bash
useradd --system --create-home --home-dir /opt/actions-runner --shell /usr/sbin/nologin actions
install -d -o actions -g actions -m 0750 /opt/actions-runner
```

```bash
export K3S_NAMESPACE=restorio
k3s kubectl create namespace "$K3S_NAMESPACE" --dry-run=client -o yaml | k3s kubectl apply -f -
k3s kubectl --namespace "$K3S_NAMESPACE" apply -f deploy/k3s/ci/restorio-deployer-rbac.yaml
```

The manifest creates a dedicated ServiceAccount with access only to that namespace.
It deliberately creates a non-expiring service-account token because the runner must deploy unattended.
Treat the resulting kubeconfig as a privileged local credential and rotate it at least every 90 days or immediately after suspected disclosure.

Create its kubeconfig without printing the token:

```bash
export K3S_NAMESPACE=restorio
install -d -o root -g actions -m 0750 /etc/restorio-ci
K3S_SERVER=$(k3s kubectl config view --raw -o jsonpath='{.clusters[0].cluster.server}')
K3S_CA_DATA=$(k3s kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')
K3S_TOKEN=$(k3s kubectl --namespace "$K3S_NAMESPACE" get secret restorio-deployer-token -o jsonpath='{.data.token}' | base64 --decode)
umask 077
{
  printf 'apiVersion: v1\nkind: Config\nclusters:\n- cluster:\n    certificate-authority-data: %s\n    server: %s\n  name: k3s\n' "$K3S_CA_DATA" "$K3S_SERVER"
  printf 'contexts:\n- context:\n    cluster: k3s\n    namespace: %s\n    user: restorio-deployer\n  name: restorio-deployer\ncurrent-context: restorio-deployer\n' "$K3S_NAMESPACE"
  printf 'users:\n- name: restorio-deployer\n  user:\n    token: %s\n' "$K3S_TOKEN"
} > /etc/restorio-ci/kubeconfig
chown root:actions /etc/restorio-ci/kubeconfig
chmod 0640 /etc/restorio-ci/kubeconfig
unset K3S_TOKEN
```

`actions` is the system user that runs the GitHub Actions runner in the next section.

## Install the GitHub Actions runner

In GitHub, open the repository's **Settings** then **Actions** then **Runners** and choose **New self-hosted runner** for Linux x64.
Do not paste the one-time registration token into chat, a terminal history file, or source control.

Download and extract the runner using the exact commands GitHub displays.
Then configure it as the `actions` user with the environment label for this VPS:

```bash
su -s /bin/bash actions -c './config.sh --unattended --replace --url https://github.com/restorio-labs/restorio-fullstack --token YOUR_ONE_TIME_TOKEN --name YOUR_NODE_NAME --labels restorio-preview'
./svc.sh install actions
./svc.sh start
```

Use `restorio-production` instead of `restorio-preview` on the production VPS.
Run the `config.sh` command in `/opt/actions-runner` after extracting the runner there.

## GitHub Environment configuration

Create `preview` and `production` Environments in GitHub.
For each one, set `K3S_NAMESPACE` to `restorio` and add `GHCR_PULL_TOKEN`, a token with read-only access to the Restorio container packages.
Use required reviewers for the `production` Environment.

## Runner isolation

The `actions` user can read the local deployment kubeconfig.
Therefore this runner must run only the deployment workflow for this repository and must never run pull-request or other untrusted code.
Place it in a runner group restricted to `restorio-labs/restorio-fullstack` and do not target generic `self-hosted` labels from other workflows.
Keep production deployments behind GitHub Environment approval.

## Rotate the deployment token

Rotation revokes the old local kubeconfig and creates a replacement.
Run this on the relevant VPS as root, then repeat the kubeconfig creation commands above:

```bash
export K3S_NAMESPACE=restorio
k3s kubectl --namespace "$K3S_NAMESPACE" delete secret restorio-deployer-token
k3s kubectl --namespace "$K3S_NAMESPACE" apply -f deploy/k3s/ci/restorio-deployer-rbac.yaml
```
