#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <staging|production>" >&2
  exit 1
fi

ENVIRONMENT=$1

kubectl get --raw=/readyz >/dev/null
kubectl get "namespace/$ENVIRONMENT" >/dev/null
kubectl --namespace "$ENVIRONMENT" get limitrange restorio-defaults >/dev/null
kubectl --namespace "$ENVIRONMENT" get resourcequota restorio-capacity >/dev/null
kubectl --namespace "$ENVIRONMENT" get serviceaccount ci-deployer >/dev/null

kubectl auth can-i create deployments.apps --as="system:serviceaccount:$ENVIRONMENT:ci-deployer" --namespace "$ENVIRONMENT" | grep --quiet '^yes$'
kubectl auth can-i get secrets --as="system:serviceaccount:$ENVIRONMENT:ci-deployer" --namespace "$ENVIRONMENT" | grep --quiet '^no$'
kubectl auth can-i create namespaces --as="system:serviceaccount:$ENVIRONMENT:ci-deployer" | grep --quiet '^no$'
kubectl auth can-i create clusterrolebindings.rbac.authorization.k8s.io --as="system:serviceaccount:$ENVIRONMENT:ci-deployer" | grep --quiet '^no$'
kubectl auth can-i get pods --as="system:serviceaccount:$ENVIRONMENT:ci-deployer" --namespace kube-system | grep --quiet '^no$'

kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.metadata.labels.restorio\.org/environment}{"\n"}{end}' \
  | grep --quiet " $ENVIRONMENT$"

echo "Cluster boundary validation passed for $ENVIRONMENT"
