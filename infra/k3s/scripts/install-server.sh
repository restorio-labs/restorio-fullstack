#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
K3S_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root" >&2
  exit 1
fi

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <staging|production> <node-ip> <private-api-dns-name>" >&2
  exit 1
fi

ENVIRONMENT=$1
NODE_IP=$2
TLS_SAN=$3

case "$ENVIRONMENT" in
  staging | production) ;;
  *)
    echo "Environment must be staging or production" >&2
    exit 1
    ;;
esac

if [[ ! "$NODE_IP" =~ ^[0-9a-fA-F:.]+$ ]]; then
  echo "Node IP contains unsupported characters" >&2
  exit 1
fi

if [[ ! "$TLS_SAN" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  echo "Private API DNS name contains unsupported characters" >&2
  exit 1
fi

case "$(uname -m)" in
  x86_64)
    ARCH=amd64
    ;;
  *)
    echo "Unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

# shellcheck source=../versions.env
source "$K3S_DIR/versions.env"

if [ "$ARCH" != "amd64" ]; then
  echo "Missing checksum for architecture: $ARCH" >&2
  exit 1
fi

EXPECTED_SHA256=$K3S_SHA256_AMD64
DOWNLOAD_VERSION=${K3S_VERSION/+/%2B}
DOWNLOAD_URL="https://github.com/k3s-io/k3s/releases/download/${DOWNLOAD_VERSION}/k3s"
TEMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf -- "$TEMP_DIR"
}

trap cleanup EXIT

curl --fail --location --silent --show-error "$DOWNLOAD_URL" --output "$TEMP_DIR/k3s"
echo "$EXPECTED_SHA256  $TEMP_DIR/k3s" | sha256sum --check --status

if [ -x /usr/local/bin/k3s ] && ! echo "$EXPECTED_SHA256  /usr/local/bin/k3s" | sha256sum --check --status; then
  install --directory --owner=root --group=root --mode=0700 /var/lib/restorio/k3s-binaries
  CURRENT_SHA256=$(sha256sum /usr/local/bin/k3s | cut -d ' ' -f 1)
  install --owner=root --group=root --mode=0700 /usr/local/bin/k3s "/var/lib/restorio/k3s-binaries/k3s-$CURRENT_SHA256"
fi

install --owner=root --group=root --mode=0755 "$TEMP_DIR/k3s" /usr/local/bin/k3s

install --directory --owner=root --group=root --mode=0700 /etc/rancher/k3s
install --directory --owner=root --group=root --mode=0755 /var/lib/rancher/k3s

cat > /etc/rancher/k3s/config.yaml <<EOF
write-kubeconfig-mode: "0600"
node-ip: "$NODE_IP"
advertise-address: "$NODE_IP"
tls-san:
  - "$TLS_SAN"
secrets-encryption: true
node-label:
  - "restorio.org/environment=$ENVIRONMENT"
  - "restorio.org/role=server-worker"
EOF

cat > /etc/systemd/system/k3s.service <<'EOF'
[Unit]
Description=Lightweight Kubernetes
Documentation=https://docs.k3s.io/
Wants=network-online.target
After=network-online.target

[Service]
Type=notify
EnvironmentFile=-/etc/default/k3s
KillMode=process
Delegate=yes
LimitNOFILE=1048576
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
TimeoutStartSec=0
Restart=always
RestartSec=5s
ExecStartPre=/sbin/modprobe br_netfilter
ExecStartPre=/sbin/modprobe overlay
ExecStart=/usr/local/bin/k3s server

[Install]
WantedBy=multi-user.target
EOF

ln -sfn /usr/local/bin/k3s /usr/local/bin/kubectl
ln -sfn /usr/local/bin/k3s /usr/local/bin/crictl
ln -sfn /usr/local/bin/k3s /usr/local/bin/ctr

systemctl daemon-reload
systemctl enable k3s
systemctl restart k3s

for _ in $(seq 1 60); do
  if /usr/local/bin/k3s kubectl get --raw=/readyz >/dev/null 2>&1; then
    echo "k3s $K3S_VERSION is ready for $ENVIRONMENT"
    exit 0
  fi

  sleep 2
done

echo "k3s did not become ready within 120 seconds" >&2
systemctl status k3s --no-pager >&2 || true
exit 1
