#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
K3S_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <staging|production>" >&2
  exit 1
fi

ENVIRONMENT=$1
OVERLAY="$K3S_DIR/overlays/$ENVIRONMENT"

if [ ! -f "$OVERLAY/kustomization.yaml" ]; then
  echo "Unknown environment: $ENVIRONMENT" >&2
  exit 1
fi

kubectl kustomize "$OVERLAY" | kubectl apply --server-side --field-manager=restorio-platform -f -
kubectl wait --for=jsonpath='{.status.phase}'=Active "namespace/$ENVIRONMENT" --timeout=60s

echo "Applied platform boundary for $ENVIRONMENT"
