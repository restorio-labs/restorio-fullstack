#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <staging|production> <private-api-url> <output-file>" >&2
  exit 1
fi

ENVIRONMENT=$1
API_URL=$2
OUTPUT_FILE=$3
SERVICE_ACCOUNT=ci-deployer
TOKEN_SECRET=ci-deployer-token

case "$ENVIRONMENT" in
  staging | production) ;;
  *)
    echo "Environment must be staging or production" >&2
    exit 1
    ;;
esac

case "$API_URL" in
  https://*) ;;
  *)
    echo "Private API URL must use HTTPS" >&2
    exit 1
    ;;
esac

umask 077

if ! kubectl --namespace "$ENVIRONMENT" get secret "$TOKEN_SECRET" >/dev/null 2>&1; then
  kubectl --namespace "$ENVIRONMENT" apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: $TOKEN_SECRET
  annotations:
    kubernetes.io/service-account.name: $SERVICE_ACCOUNT
type: kubernetes.io/service-account-token
EOF
fi

for _ in $(seq 1 30); do
  TOKEN=$(kubectl --namespace "$ENVIRONMENT" get secret "$TOKEN_SECRET" -o jsonpath='{.data.token}' 2>/dev/null || true)
  CA_DATA=$(kubectl --namespace "$ENVIRONMENT" get secret "$TOKEN_SECRET" -o jsonpath='{.data.ca\.crt}' 2>/dev/null || true)

  if [ -n "$TOKEN" ] && [ -n "$CA_DATA" ]; then
    break
  fi

  sleep 1
done

if [ -z "${TOKEN:-}" ] || [ -z "${CA_DATA:-}" ]; then
  echo "Service account token was not populated" >&2
  exit 1
fi

TOKEN_VALUE=$(printf '%s' "$TOKEN" | base64 --decode)

cat > "$OUTPUT_FILE" <<EOF
apiVersion: v1
kind: Config
clusters:
  - name: restorio-$ENVIRONMENT
    cluster:
      certificate-authority-data: $CA_DATA
      server: $API_URL
contexts:
  - name: restorio-$ENVIRONMENT
    context:
      cluster: restorio-$ENVIRONMENT
      namespace: $ENVIRONMENT
      user: ci-deployer
current-context: restorio-$ENVIRONMENT
users:
  - name: ci-deployer
    user:
      token: $TOKEN_VALUE
EOF

chmod 0600 "$OUTPUT_FILE"

echo "Wrote restricted kubeconfig to $OUTPUT_FILE"
echo "Store it as an environment-scoped CI secret and remove the local copy"
