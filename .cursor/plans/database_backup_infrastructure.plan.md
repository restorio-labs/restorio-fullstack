---
name: Database Backup Infrastructure
overview: Implement robust, automated backup strategies for MongoDB and PostgreSQL with point-in-time recovery, offsite storage, encryption, and monitoring.
todos:
  - id: backup-001
    content: "Audit current database instances, sizes, growth rates, and RPO/RTO requirements"
    status: pending
  - id: backup-002
    content: "Provision secure offsite storage (S3 bucket with versioning, lifecycle policies, and encryption)"
    status: pending
  - id: backup-003
    content: "Set up PostgreSQL logical backups via pg_dump (daily custom-format compressed dumps)"
    status: pending
  - id: backup-004
    content: "Set up PostgreSQL physical backups via pgBackRest (incremental, parallel)"
    status: pending
  - id: backup-005
    content: "Enable PostgreSQL WAL archiving to offsite storage for PITR"
    status: pending
  - id: backup-006
    content: "Set up MongoDB logical backups via mongodump (daily gzipped archives)"
    status: pending
  - id: backup-007
    content: "Set up MongoDB oplog-based continuous backup (PBM or equivalent) for PITR"
    status: pending
  - id: backup-008
    content: "Implement encryption at rest (AES-256) and in transit (TLS) for all backup artifacts"
    status: pending
  - id: backup-009
    content: "Define and implement retention policy (hourly/24h, daily/30d, weekly/1y)"
    status: pending
  - id: backup-010
    content: "Create automated restore-test pipeline (weekly restore to ephemeral environment)"
    status: pending
  - id: backup-011
    content: "Set up monitoring and alerting for backup job success/failure/duration"
    status: pending
  - id: backup-012
    content: "Write runbook for manual disaster recovery restore procedures"
    status: pending
  - id: backup-013
    content:  "Perform full DR drill — restore both databases from offsite to blank environment"
    status: pending
isProject: false
---

# Database Backup Infrastructure

## Overview

```mermaid
flowchart TD
  subgraph Sources
      PG[(PostgreSQL)]
      MG[(MongoDB)]
  end

  subgraph Logical Backups
      PG -->|pg_dump -Fc daily| PG_DUMP[pg_dump archive]
      MG -->|mongodump --gzip daily| MG_DUMP[mongodump archive]
  end

  subgraph Physical / Continuous
      PG -->|WAL archiving| WAL[WAL Segments]
      PG -->|pgBackRest incremental| PG_PHYS[Base Backup + Incrementals]
      MG -->|Oplog tailing via PBM| MG_OPLOG[Oplog PITR Stream]
  end

  subgraph Storage Tiers
      LOCAL[Local / Fast Disk]
      S3[S3 — Primary Offsite]
      S3_CROSS[S3 Cross-Region Replica]
  end

  PG_DUMP --> LOCAL --> S3
  MG_DUMP --> LOCAL --> S3
  WAL --> S3
  PG_PHYS --> S3
  MG_OPLOG --> S3
  S3 -->|Replication rule| S3_CROSS

  subgraph Verification
      S3 -->|Weekly| RESTORE_TEST[Ephemeral Restore Environment]
      RESTORE_TEST -->|Validate checksums & queries| REPORT[Backup Health Report]
  end

  subgraph Monitoring
      PROM[Prometheus / CloudWatch]
      ALERT[PagerDuty / Slack Alerts]
      REPORT --> PROM --> ALERT
  end
```



## Goals

1. RPO ≤ 1 hour — maximum acceptable data loss window via continuous WAL/oplog archiving
2. RTO ≤ 4 hours — full restore from offsite to operational state
3. 3-2-1 compliance — 3 copies, 2 media types, 1 offsite (cross-region)
4. Verified backups — automated weekly restore tests; unverified backups are assumptions
5. Encryption everywhere — at rest (AES-256 / SSE-S3) and in transit (TLS)

## Retention Policy


| Granularity                  | Retention | Type              |
| ---------------------------- | --------- | ----------------- |
| Hourly WAL/oplog segments    | 48 hours  | Continuous / PITR |
| Daily logical dump           | 30 days   | Logical           |
| Daily incremental (physical) | 14 days   | Physical          |
| Weekly full (physical)       | 90 days   | Physical          |
| Monthly logical dump         | 1 year    | Logical / Archive |


## PostgreSQL Backup Strategy

### Logical — pg_dump

```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y-%m-%dT%H%M%S)
DB_NAME="myapp"
BACKUP_DIR="/backups/postgres/logical"
S3_BUCKET="s3://company-db-backups/postgres/logical"

mkdir -p "$BACKUP_DIR"

pg_dump -Fc -Z6 \
-h "$PGHOST" -U "$PGUSER" -d "$DB_NAME" \
-f "$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump"

# Encrypt and push offsite
gpg --batch --yes --symmetric --cipher-algo AES256 \
--passphrase-file /etc/backup/.gpg-pass \
"$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump"

aws s3 cp "$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump.gpg" \
"$S3_BUCKET/${DB_NAME}-${TIMESTAMP}.dump.gpg" \
--sse aws:kms

# Cleanup local files older than 7 days
find "$BACKUP_DIR" -type f -mtime +7 -delete
```

### Physical — pgBackRest

```ini
# /etc/pgbackrest/pgbackrest.conf
[global]
repo1-type=s3
repo1-s3-bucket=company-db-backups
repo1-s3-region=us-east-1
repo1-s3-endpoint=s3.amazonaws.com
repo1-s3-key=<from-iam-role>
repo1-path=/postgres/physical
repo1-retention-full=4
repo1-retention-diff=14
repo1-cipher-type=aes-256-cbc
repo1-cipher-pass=<vault-managed>
compress-type=zst
compress-level=3

[myapp]
pg1-path=/var/lib/postgresql/16/main
bash
# Weekly full
pgbackrest --stanza=myapp --type=full backup

# Daily incremental
pgbackrest --stanza=myapp --type=incr backup

# PITR restore example
pgbackrest --stanza=myapp --type=time \
--target="2026-03-17 18:00:00+00" restore

WAL Archiving
ini
# postgresql.conf
archive_mode = on
archive_command = 'pgbackrest --stanza=myapp archive-push %p'
wal_level = replica
```

## MongoDB Backup Strategy

### Logical — mongodump

```bash
bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y-%m-%dT%H%M%S)
BACKUP_DIR="/backups/mongodb/logical"
S3_BUCKET="s3://company-db-backups/mongodb/logical"

mkdir -p "$BACKUP_DIR"

mongodump \
--uri="mongodb+srv://$MONGO_USER:$MONGO_PASS@cluster0.example.net" \
--archive="$BACKUP_DIR/mongo-${TIMESTAMP}.archive" \
--gzip \
--readPreference=secondary

# Encrypt and push offsite
gpg --batch --yes --symmetric --cipher-algo AES256 \
--passphrase-file /etc/backup/.gpg-pass \
"$BACKUP_DIR/mongo-${TIMESTAMP}.archive"

aws s3 cp "$BACKUP_DIR/mongo-${TIMESTAMP}.archive.gpg" \
"$S3_BUCKET/mongo-${TIMESTAMP}.archive.gpg" \
--sse aws:kms

find "$BACKUP_DIR" -type f -mtime +7 -delete
```

### Continuous / PITR — Percona Backup for MongoDB (PBM)

```yaml
yaml
# /etc/pbm/pbm-config.yaml
storage:
type: s3
s3:
  region: us-east-1
  bucket: company-db-backups
  prefix: mongodb/pbm
  credentials:
    access-key-id: <from-iam-role>
    secret-access-key: <from-iam-role>
  serverSideEncryption:
    sseAlgorithm: aws:kms
    kmsKeyID: <key-arn>

pitr:
enabled: true
oplogSpanMin: 10

backup:
compression: zstd
```

```bash
# Schedule via cron or systemd timer
pbm backup --type=full          # weekly
pbm backup --type=incremental   # daily

# PITR restore
pbm restore --time="2026-03-17T18:00:00Z"
```

### Restore Verification (Automated)

```bash
#!/usr/bin/env bash
# restore-test.sh — runs weekly in CI or ephemeral infra
set -euo pipefail

echo "=== PostgreSQL restore test ==="
LATEST_PG=$(aws s3 ls s3://company-db-backups/postgres/logical/ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://company-db-backups/postgres/logical/$LATEST_PG" /tmp/pg-test.dump.gpg
gpg --batch --decrypt --passphrase-file /etc/backup/.gpg-pass /tmp/pg-test.dump.gpg > /tmp/pg-test.dump
pg_restore -d pg_restore_test /tmp/pg-test.dump
psql -d pg_restore_test -c "SELECT count(*) FROM critical_table;" | grep -q '[0-9]'
echo "✅ PostgreSQL restore verified"

echo "=== MongoDB restore test ==="
LATEST_MG=$(aws s3 ls s3://company-db-backups/mongodb/logical/ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://company-db-backups/mongodb/logical/$LATEST_MG" /tmp/mg-test.archive.gpg
gpg --batch --decrypt --passphrase-file /etc/backup/.gpg-pass /tmp/mg-test.archive.gpg > /tmp/mg-test.archive
mongorestore --archive=/tmp/mg-test.archive --gzip --db=mg_restore_test
mongosh mg_restore_test --eval "assert(db.critical_collection.countDocuments({}) > 0)"
echo "✅ MongoDB restore verified"
```

## Monitoring & Alerting


| Signal                          | Source                  | Alert Threshold        |
| ------------------------------- | ----------------------- | ---------------------- |
| Backup job exit code ≠ 0        | Cron / systemd journal  | Immediate — P1         |
| No new backup artifact in 26h   | S3 object timestamps    | Immediate — P1         |
| Backup duration > 2× baseline   | Prometheus metrics      | Warning — P2           |
| Restore test failure            | CI pipeline             | Next business day — P2 |
| Backup storage > 80% quota      | S3 / CloudWatch         | Warning — P3           |
| WAL/oplog archiving lag > 30min | pgBackRest / PBM status | Immediate — P1         |


### Key Files Summary


| Area                             | Key Files                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| PostgreSQL logical backup        | scripts/backup-pg-logical.sh, cron: /etc/cron.d/pg-backup                            |
| PostgreSQL physical (pgBackRest) | /etc/pgbackrest/pgbackrest.conf, postgresql.conf (WAL settings)                      |
| MongoDB logical backup           | scripts/backup-mongo-logical.sh, cron: /etc/cron.d/mongo-backup                      |
| MongoDB PITR (PBM)               | /etc/pbm/pbm-config.yaml, systemd: pbm-agent.service                                 |
| Encryption keys                  | Vault path: secret/backup/gpg-passphrase, AWS KMS ARN in Terraform                   |
| Restore verification             | scripts/restore-test.sh, CI pipeline: .github/workflows/backup-verify.yml            |
| Monitoring                       | monitoring/backup-alerts.rules.yml, Grafana dashboard: dashboards/backup-health.json |
| Runbook                          | docs/runbook-disaster-recovery.md                                                    |
| Retention / lifecycle            | terraform/s3-backup-lifecycle.tf                                                     |
| This plan                        | .plan.md                                                                             |


