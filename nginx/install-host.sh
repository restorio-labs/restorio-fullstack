#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="/etc/nginx/nginx.conf"

for port in 20122 30122; do
  if command -v ss >/dev/null 2>&1; then
    if ss -ltnp | grep -q ":${port}\\b"; then
      listeners=$(ss -ltnp | grep ":${port}\\b" || true)
      if echo "$listeners" | grep -q docker-proxy; then
        echo "Port ${port} is still held by Docker. Free it or change the published port:" >&2
        exit 1
      fi
    fi
  fi
done

if [[ -f /etc/debian_version ]] && [[ ! -f /etc/ssl/certs/ssl-cert-snakeoil.pem ]]; then
  DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ssl-cert
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

if [[ -f "$TARGET" ]] && [[ ! -f "${TARGET}.bak.restorio" ]]; then
  cp -a "$TARGET" "${TARGET}.bak.restorio"
fi

cp "${ROOT}/nginx/nginx.conf" "$TARGET"
chmod 644 "$TARGET"

STATIC_ROOT="/var/www/restorio-platform"
install -d -m755 -o www-data -g www-data "$STATIC_ROOT/restorio" "$STATIC_ROOT/admin"
install -m644 "${ROOT}/nginx/www/restorio/index.html" "$STATIC_ROOT/restorio/index.html"
install -m644 "${ROOT}/nginx/www/admin/index.html" "$STATIC_ROOT/admin/index.html"
chown www-data:www-data "$STATIC_ROOT/restorio/index.html" "$STATIC_ROOT/admin/index.html"

if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

echo "Host nginx installed from ${ROOT}/nginx/nginx.conf"
