# ADR 0002: Define the initial observability architecture

- Status: Accepted
- Date: 2026-08-05
- Decision owners: Restorio maintainers
- Related issues: [#147](https://github.com/restorio-labs/restorio-fullstack/issues/147), [#200](https://github.com/restorio-labs/restorio-fullstack/issues/200), [#202](https://github.com/restorio-labs/restorio-fullstack/issues/202), [#152](https://github.com/restorio-labs/restorio-fullstack/issues/152)

## Context

Restorio needs centralized metrics, dashboards, alerts, and logs for its staging and production k3s clusters.
The first production topology is intentionally small and may start on one k3s node.
The observability stack must therefore provide useful operational coverage without adding distributed-system complexity that the current scale does not justify.
This ADR inherits the separate staging and production cluster boundary accepted under #147.

This decision covers the initial observability control plane and the collection paths used by Kubernetes workloads and Restorio applications.
It does not deploy the stack.
The deployment remains the responsibility of the implementation tickets under epic #200.

## Decision drivers

- Keep the first deployment operable on a small k3s cluster
- Preserve application availability when the observability stack is degraded
- Keep configuration reproducible and reviewable in Git
- Bound disk and memory consumption
- Avoid high-cardinality metrics and log labels
- Protect operational data and administrative endpoints
- Provide a clear path to higher availability when measured demand requires it

## Decision

Restorio will deploy one independent observability stack in each staging and production k3s cluster.
The initial stack consists of Prometheus, Grafana, Alertmanager, Grafana Loki, Grafana Alloy, kube-state-metrics, and node-exporter.

Prometheus will run with exactly one replica and one shard.
Prometheus will not use a HorizontalPodAutoscaler.
Its local TSDB will use persistent storage with both time-based and size-based retention.

Loki will initially run as one single-binary instance with TSDB indexing and filesystem storage on a persistent volume.
Alloy will run as a DaemonSet and will tail Kubernetes container logs from every node.

Kafka, Redpanda, RabbitMQ, Redis, and database-backed queues are excluded from the logging pipeline.
Applications write structured JSON logs to standard output, the container runtime persists the node-local log files, Alloy tails those files, and Alloy sends them directly to Loki over the cluster network.
An observability outage must never make an application request depend on or wait for log delivery.

## Initial topology and data flow

```text
staging k3s cluster                         production k3s cluster
┌──────────────────────────────┐           ┌──────────────────────────────┐
│ applications                 │           │ applications                 │
│  ├─ /metrics ─────────────┐  │           │  ├─ /metrics ─────────────┐  │
│  └─ JSON logs to stdout ─┐│  │           │  └─ JSON logs to stdout ─┐│  │
│                          ││  │           │                          ││  │
│ Prometheus <─────────────┘│  │           │ Prometheus <─────────────┘│  │
│  ├─ kube-state-metrics     │  │           │  ├─ kube-state-metrics     │  │
│  ├─ node-exporter          │  │           │  ├─ node-exporter          │  │
│  └─ rules ─> Alertmanager  │  │           │  └─ rules ─> Alertmanager  │  │
│                            │  │           │                            │  │
│ Alloy DaemonSet <──────────┘  │           │ Alloy DaemonSet <──────────┘  │
│  └─ direct push ─> Loki       │           │  └─ direct push ─> Loki       │
│                               │           │                               │
│ Grafana ─> Prometheus + Loki  │           │ Grafana ─> Prometheus + Loki  │
└──────────────────────────────┘           └──────────────────────────────┘
```

No telemetry is shared between environments by default.
There is no cross-cluster scraping, log shipping, or dashboard data source.

## Component responsibilities

### Prometheus

Prometheus discovers and scrapes Kubernetes, exporter, application, and observability-component metrics.
It stores recent time-series data, evaluates recording and alerting rules, and sends firing alerts to Alertmanager.
It is the source of truth for current operational metrics, but it is not a durable business-data store.

The initial deployment has these hard constraints:

- `replicas: 1`
- `shards: 1`
- no HPA
- no Thanos
- no remote write
- no long-term object storage

### Grafana

Grafana is the read interface for Prometheus metrics and Loki logs.
Prometheus and Loki data sources, dashboards, folders, and alert-related configuration must be provisioned from repository-managed configuration.
Manual dashboard edits may be used for exploration, but they are not a source of truth and must be exported to Git before they are relied upon operationally.

### Alertmanager

Alertmanager receives alerts from Prometheus, groups related alerts, suppresses duplicates, applies inhibition rules, and routes notifications to configured receivers.
Alert routing and templates are stored in Git.
Receiver credentials are supplied through Kubernetes Secrets and are never committed.

### Grafana Loki

Loki stores and queries recent Kubernetes and application logs.
The initial single-binary process includes ingestion, querying, compaction, and retention responsibilities.
Loki is not a business event store, audit ledger, analytics pipeline, or backup destination.

### Grafana Alloy

Alloy runs once on every k3s node as a DaemonSet.
It discovers pods, tails container log files, attaches an approved low-cardinality label set, parses structured application logs, and pushes log batches directly to Loki.
Alloy retries temporary delivery failures within configured backoff and queue limits.
It does not provide a durable cross-node message queue.

### kube-state-metrics

kube-state-metrics exposes metrics derived from Kubernetes object state, including deployments, pods, jobs, and resource requests.
It is read-only and stores no persistent application state.

### node-exporter

node-exporter runs on every node and exposes host CPU, memory, filesystem, and network metrics.
It stores no persistent state.

### Application metrics

Restorio services expose Prometheus-format metrics on an internal endpoint that is reachable by Prometheus and not exposed through the public application ingress.
Metrics cover request rates, errors, latency, dependency health, background work, and domain signals that are safe to aggregate.
Routes use normalized route templates rather than raw URLs.
Metrics must not use tenant IDs, user IDs, request IDs, order IDs, trace IDs, or other unbounded values as labels.

### Structured application logs

Production applications write one valid JSON object per line to standard output.
The common fields include timestamp, severity, service, environment, version, Git SHA, message, request ID, trace ID when available, normalized route, and duration.
Tenant and correlation identifiers may be retained as parsed log fields when policy permits, but they must not become Loki labels.
Secrets, credentials, authorization headers, payment payloads, and unnecessary personal data must be redacted before logging.

## Capacity baseline

These values are the initial production ceilings, not permanent sizing claims.
The deployment tickets must validate them in staging and record actual peak CPU, memory, ingestion, series count, and disk growth before production rollout.

| Component | Workload | Initial replicas | CPU request | CPU limit | Memory request | Memory limit | Persistent storage |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Prometheus | StatefulSet | 1 | 250m | 1 | 1Gi | 2Gi | 30Gi RWO PVC |
| Grafana | Deployment | 1 | 100m | 500m | 128Mi | 512Mi | 5Gi RWO PVC |
| Alertmanager | StatefulSet | 1 | 50m | 200m | 64Mi | 256Mi | 2Gi RWO PVC |
| Loki | StatefulSet, single binary | 1 | 250m | 1 | 512Mi | 2Gi | 30Gi RWO PVC |
| Alloy | DaemonSet | 1 per node | 100m | 500m | 128Mi | 512Mi | None |
| kube-state-metrics | Deployment | 1 | 50m | 200m | 64Mi | 256Mi | None |
| node-exporter | DaemonSet | 1 per node | 20m | 100m | 32Mi | 128Mi | None |

The persistent volumes must use a k3s storage class with `ReadWriteOnce` support and documented node-failure behavior.
Prometheus local storage must use a POSIX-compatible filesystem and must not use NFS.

CPU limits may be relaxed during staging validation if throttling harms ingestion or query reliability.
Memory limits remain mandatory because an unbounded observability workload must not evict application workloads.
Any increase must be based on recorded usage and cluster capacity, not guesswork.

## Retention and storage controls

### Metrics

Prometheus retains metrics for 15 days or 24 GB, whichever limit is reached first.
The 24 GB size limit leaves 20 percent of the 30 GiB volume for the WAL, head chunks, compaction, and filesystem overhead.
Alerts fire at 70, 85, and 95 percent volume utilization.

The implementation must set both `retention: 15d` and `retentionSize: 24GB` through the selected Prometheus chart values.
The implementation must also monitor ingestion rate, active series, WAL growth, compaction failures, and TSDB corruption signals.

### Logs

Loki retains logs for 14 days.
Retention is enforced by the Loki Compactor and must be explicitly enabled.
The TSDB schema uses a 24-hour index period so that compactor retention is supported.
The compactor working directory, retention markers, and deletion-request store use the same Loki persistent volume in the initial single-binary deployment.

Filesystem-backed Loki does not enforce a hard byte cap.
The 30 GiB volume therefore requires alerts at 70, 85, and 95 percent utilization and a measured daily growth dashboard.
At 85 percent utilization, operators must reduce noisy log volume, shorten retention, or expand the volume before ingestion reaches the filesystem limit.
Per-stream ingestion limits and rejection metrics must be configured and monitored so one workload cannot exhaust storage silently.

Container-runtime log rotation remains enabled on every node.
Those node-local files provide only a short delivery buffer during a Loki or Alloy outage and are not a second log archive.

## Availability and failure behavior

Observability is off the application request path.
Applications expose metrics for pull-based scraping and write logs to standard output without synchronously contacting Prometheus, Alloy, Loki, Grafana, or Alertmanager.

A Prometheus outage creates a monitoring gap but does not stop workloads.
A Loki or Alloy outage creates a log-ingestion gap after node-local rotated logs are exhausted but does not stop workloads.
A Grafana outage removes the shared query interface but does not stop metric collection, log ingestion, or alert evaluation.
An Alertmanager outage may delay or lose notifications while Prometheus continues evaluating rules.

All observability workloads must have readiness and liveness probes where the upstream component supports them.
PodDisruptionBudgets must not claim availability that a single replica cannot provide.

## Backup and recovery

Git is the primary backup for Helm values, dashboards, data sources, alert rules, routing templates, Alloy configuration, and runbooks.
Secret values follow the platform secret-management and backup process and are not stored in Git.

Metrics and logs are operational evidence, not systems of record.
The initial phase accepts the loss of locally stored metrics and logs after unrecoverable volume or node failure.
This gives both stores an initial recovery point objective equal to the full locally retained window and a recovery time objective of four hours to recreate the service and resume collection.

Prometheus and Loki volumes are not copied with naive filesystem-level backups while their processes are running.
If infrastructure issue #153 supplies volume snapshots, daily crash-consistent snapshots may be enabled with seven days of snapshot retention and a restore test before they are treated as recoverable backups.
Prometheus API snapshots are the required application-consistent method if metrics backup becomes mandatory.

Grafana's persistent volume is snapshotted daily with seven days of retention once the platform snapshot facility exists.
The stack must still be reconstructable from Git and Secrets if the Grafana volume is lost.
Alertmanager silences and notification history are disposable; routing configuration is reconstructed from Git.

If legal, support, or incident-response requirements make logs durable records, this ADR must be superseded before claiming that guarantee.
The likely next storage step is a dedicated Loki object-store bucket with its own tested backup and recovery policy.

## Access control and data protection

Grafana is the only component that may receive an external ingress.
That ingress requires TLS and authenticated access through the platform's approved identity layer.
Anonymous access and anonymous administrative access are disabled.
Grafana users receive the least privileged organization role required for their work.

Prometheus, Alertmanager, Loki, Alloy, kube-state-metrics, node-exporter, and application metrics endpoints are cluster-internal only.
NetworkPolicies allow only the required scrape, query, ingestion, and notification flows.
Administrative ports and profiling endpoints are not publicly exposed.

Kubernetes RBAC for Prometheus, Alloy, and exporters grants read-only discovery permissions limited to the resources they need.
Service accounts are dedicated per component and do not reuse application service accounts.
Credentials and notification receiver tokens are mounted from Kubernetes Secrets and are redacted from logs.

Dashboards and logs may expose operational tenant context.
Access to production telemetry is therefore restricted to authorized operators, access is auditable, and telemetry must follow the platform's data-handling rules.

## Environment separation

Staging and production use separate k3s clusters, namespaces, Helm releases, service accounts, Secrets, persistent volumes, Grafana organizations or instances, and notification routes.
Production data sources never point at staging, and staging data sources never point at production.
Production alert receivers are distinct from test receivers.

Resource sizes and retention may be reduced in staging, but the topology and security controls remain equivalent so deployment behavior is exercised before production.
Local development may use console logs and an optional disposable observability stack.
Local development is not a source of production telemetry.

## Configuration ownership and deployment

Observability configuration is reviewed and versioned in this repository.
Helm releases must use pinned chart versions and environment-specific values.
Generated Secrets, live Grafana edits, and manual cluster changes are not accepted as the only source of truth.

Each deployment ticket must provide validation for its acceptance criteria.
At minimum, validation covers Prometheus target discovery and persistence, Grafana data sources, alert delivery, Loki ingestion and retention, Alloy coverage on every node, access restrictions, and recovery after pod restart.

## Future high-availability path

High availability is intentionally not implemented by this decision.
The single-node production topology cannot provide infrastructure-level HA even if individual observability components have extra replicas.

The architecture must be reviewed when any of these conditions is met:

- production moves to at least three failure-independent k3s nodes
- monitoring or logging availability receives a formal service-level objective
- a single Prometheus instance cannot meet ingestion or query demand within its resource budget
- the required retention no longer fits safely on one volume
- loss of one node would violate an approved metrics or logs recovery objective
- alert delivery becomes business-critical enough to require redundant routing

The expected evolution is:

1. Move Loki from filesystem storage to a dedicated object-store bucket and adopt simple-scalable or distributed mode only after measured demand justifies it.
2. Run Alertmanager as a three-replica cluster across failure domains.
3. Run multiple Grafana replicas with an external supported database and shared configuration.
4. Run two Prometheus replicas for scrape and rule-evaluation redundancy.
5. Add Thanos, Mimir, or another remote storage layer only when long-term retention, global queries, or durable metric history is required.
6. Apply anti-affinity, topology spread constraints, and disruption budgets after the cluster has enough independent nodes to honor them.

Prometheus horizontal sharding and an HPA remain excluded until a separate ADR demonstrates why vertical sizing, cardinality control, and scrape tuning are insufficient.

## Alternatives rejected for the initial phase

### Multi-replica Prometheus with Thanos

This provides better availability and long-term storage, but it adds object storage, sidecars, query components, deduplication behavior, and a larger operational surface.
The current cluster size and retention requirements do not justify it.

### Prometheus HPA

An HPA does not safely turn a stateful Prometheus server into a horizontally scalable system.
Adding replicas without an explicit sharding, replication, or query-deduplication design would duplicate scraping and alert evaluation while leaving storage semantics unclear.

### Loki simple-scalable or distributed mode

These modes improve independent scaling at higher volume but require more workloads, object storage, and operational coordination.
One single-binary instance is sufficient for the initial measured load.

### Kafka or another broker for log transport

A broker could buffer logs independently, but it would add another stateful production system, storage budget, security surface, monitoring stack, and recovery procedure.
Kubernetes node-local log files already provide a bounded short-term buffer, and losing telemetry must not affect application correctness.
Kafka-compatible streaming may be evaluated separately for concrete business-event use cases under #208, but it is not part of this logging architecture.

### Hosted observability as the default

A hosted stack could reduce some operations but introduces ongoing data-egress, cost, tenancy, and vendor-dependency decisions that are outside this ticket.
The initial decision keeps telemetry inside the existing k3s environments.

## Consequences

The initial stack is small, explicit, and can be operated with the current platform footprint.
Configuration is reviewable, resource usage is bounded, and failures remain isolated from application request processing.

The accepted tradeoff is that a node or volume failure can create gaps in locally retained metrics and logs.
The stack also has planned single points of failure until the production cluster and operational requirements justify the documented HA path.

Resource values are starting constraints and require staging measurements.
If the measurements do not fit within the cluster's application headroom, production rollout must stop until the stack is tuned or cluster capacity is increased.

## Implementation mapping

- #203 deploys the single-replica Prometheus stack defined here
- #204 deploys Grafana and provisions data sources
- #205 standardizes structured application logs
- #206 deploys the single-binary Loki store
- #213 deploys Alloy as a DaemonSet
- #209 adds FastAPI application metrics
- #210 deploys Kubernetes and infrastructure exporters
- #215 provisions dashboards
- #211 configures Alertmanager routes
- #207 adds operational alert rules
- #212 adds deployment validation and runbooks

## References

- [Prometheus local storage and retention](https://prometheus.io/docs/prometheus/latest/storage/)
- [Grafana Loki storage](https://grafana.com/docs/loki/latest/configure/storage/)
- [Grafana Loki retention](https://grafana.com/docs/loki/latest/operations/storage/retention/)
- [How Grafana Alloy works](https://grafana.com/docs/alloy/latest/introduction/how-alloy-works/)
