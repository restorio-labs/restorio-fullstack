# Restorio k3s runtime chart

This chart deploys the stateful Restorio dependencies as single-replica StatefulSets.
It contains PostgreSQL with PostGIS, MongoDB, and MinIO.
Each workload has one local-path PVC and a ClusterIP Service.

The chart is a separate Helm release from the API and frontend chart.
The application chart runs Alembic as a pre-install and pre-upgrade hook, so its dependencies must already be healthy before that release begins.

## Secrets

The chart never creates credentials.
Create the environment-specific secret named by `runtime.existingSecret` before installing the chart.
It must contain these keys:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `MONGODB_ROOT_USERNAME`
- `MONGODB_ROOT_PASSWORD`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`

The API runtime secret is separate.
It must use the in-cluster Service names for its database and object-storage connections.

For the preview environment, those endpoints are:

- `restorio-runtime-postgres.restorio.svc.cluster.local:5432`
- `restorio-runtime-mongo.restorio.svc.cluster.local:27017`
- `restorio-runtime-minio.restorio.svc.cluster.local:9000`

## Preview reset

Preview data is disposable during this migration.
Do not copy the old Docker Compose data or credentials.
Before the first GitHub deployment, create fresh credentials for the empty k3s runtime:

```bash
POSTGRES_PASSWORD=$(openssl rand -hex 32)
MONGODB_ROOT_PASSWORD=$(openssl rand -hex 32)
MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)

k3s kubectl create secret generic restorio-preview-data-runtime \
  --namespace restorio \
  --from-literal=POSTGRES_DB=restorio \
  --from-literal=POSTGRES_USER=restorio \
  --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --from-literal=MONGODB_ROOT_USERNAME=restorio \
  --from-literal=MONGODB_ROOT_PASSWORD="$MONGODB_ROOT_PASSWORD" \
  --from-literal=MINIO_ROOT_USER=restorio \
  --from-literal=MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
  --dry-run=client \
  --output yaml | k3s kubectl apply -f -
```

Use the same fresh credentials to update the existing `restorio-api-preview-runtime` secret.
This merge patch changes only the listed values and retains the other API configuration:

```bash
DATABASE_URL="mongodb://restorio:${MONGODB_ROOT_PASSWORD}@restorio-runtime-mongo.restorio.svc.cluster.local:27017/restorio?authSource=admin"
POSTGRES_DSN="postgresql://restorio:${POSTGRES_PASSWORD}@restorio-runtime-postgres.restorio.svc.cluster.local:5432/restorio"
MINIO_ENDPOINT=restorio-runtime-minio.restorio.svc.cluster.local:9000

patch_data() {
  printf '%s' "$1" | base64 --wrap=0
}

k3s kubectl patch secret restorio-api-preview-runtime \
  --namespace restorio \
  --type merge \
  --patch "$(printf '{\"data\":{\"DATABASE_URL\":\"%s\",\"MONGODB_USERNAME\":\"%s\",\"MONGODB_PASSWORD\":\"%s\",\"POSTGRES_DSN\":\"%s\",\"MINIO_ENDPOINT\":\"%s\",\"MINIO_ACCESS_KEY\":\"%s\",\"MINIO_SECRET_KEY\":\"%s\"}}' \
    "$(patch_data "$DATABASE_URL")" \
    "$(patch_data restorio)" \
    "$(patch_data "$MONGODB_ROOT_PASSWORD")" \
    "$(patch_data "$POSTGRES_DSN")" \
    "$(patch_data "$MINIO_ENDPOINT")" \
    "$(patch_data restorio)" \
    "$(patch_data "$MINIO_ROOT_PASSWORD")")"

unset POSTGRES_PASSWORD MONGODB_ROOT_PASSWORD MINIO_ROOT_PASSWORD DATABASE_URL POSTGRES_DSN MINIO_ENDPOINT
```

The deployment command validates those endpoints before it runs the API migration job.
After the runtime release and application smoke tests pass, remove the old PostgreSQL, MongoDB, and MinIO Compose containers and their volumes.

## Storage and exposure

The initial preview capacities are 2 GiB per service.
They use the k3s `local-path` StorageClass and therefore remain tied to this single node.
PVCs are not backups.

PostgreSQL, MongoDB, and the MinIO console are private ClusterIP services.
MinIO's object API also stays private until the ingress work provides an approved public S3 route for presigned browser uploads.
Do not retire the existing external reverse proxy until that route exists, because browser media upload and download requires it.

The preview deployment command installs or upgrades this chart before the application chart.
