# Create Observability and Event Processing GitHub Issues

Work in the following repository:

`restorio-labs/restorio-fullstack`

## Language requirement

**All issue titles, descriptions, acceptance criteria, comments, relation sections, and epic updates must be written exclusively in English.**

Do not create Polish-language issues.

## General instructions

1. Search existing open and closed issues before creating anything.
2. Do not create duplicate issues.
3. Create the epics first.
4. Save the created epic numbers.
5. Create the child issues.
6. Add relations to every child issue:

```md
## Relations

Part of #EPIC_NUMBER

Blocked by:
- #ISSUE_NUMBER

Related to:
- #ISSUE_NUMBER
```

7. After creating all child issues, update each epic with a checklist containing links to its child issues:

```md
## Child issues

- [ ] #123
- [ ] #124
```

8. Update dependencies after all issue numbers are known.
9. Use existing labels where possible.
10. Do not create labels unless supported and explicitly necessary.
11. Do not implement any code.
12. Only create and link GitHub issues.
13. Every issue must contain:

```md
## Goal

## Context

## Scope

## Out of scope

## Acceptance criteria

## Relations
```

14. Prefer the following labels if they exist:

* `epic`
* `infrastructure`
* `devops`
* `backend`
* `observability`
* `monitoring`
* `security`
* `analytics`
* `enhancement`
* `priority:high`
* `priority:medium`
* `priority:low`

---

# EPIC 1: Platform Observability and Monitoring

## Title

`[EPIC] Platform Observability and Monitoring`

## Goal

Introduce centralized metrics, dashboards, alerts, and logs for the Restorio production environment running on k3s.

## Context

The production environment needs operational visibility into:

* Kubernetes workloads;
* the FastAPI backend;
* PostgreSQL;
* MongoDB;
* MinIO;
* ingress and networking;
* application releases;
* failed requests;
* resource consumption;
* application logs.

The initial deployment must remain simple and appropriate for a small k3s environment.

Prometheus must initially run as a single pod with persistent storage.

Horizontal scaling, sharding, Thanos, and multi-replica high availability are not required in the first implementation.

## Out of scope

* using Kafka for log transport;
* Prometheus sharding;
* Prometheus horizontal autoscaling;
* multi-cluster monitoring;
* long-term metrics storage;
* full distributed tracing in the initial phase.

---

## Ticket 1.1

### Title

`[ADR] Define the Restorio observability architecture`

### Goal

Document the initial architecture for metrics, logs, dashboards, and alerts.

### Scope

Define the responsibilities of:

* Prometheus;
* Grafana;
* Alertmanager;
* Grafana Loki;
* Grafana Alloy;
* Kubernetes exporters;
* application metrics;
* structured application logs.

Document the initial topology:

```text
k3s
├── Prometheus
├── Grafana
├── Alertmanager
├── Loki
├── Alloy
├── kube-state-metrics
└── node-exporter
```

Define:

* metrics retention;
* log retention;
* persistent storage requirements;
* resource requests and limits;
* backup expectations;
* access control;
* environment separation;
* future upgrade path.

### Acceptance criteria

* an ADR is added to the repository;
* the responsibility of each component is documented;
* the initial deployment uses one Prometheus replica;
* Prometheus does not use an HPA;
* Kafka is explicitly excluded from the logging pipeline;
* the future path to high availability is documented without implementing it.

---

## Ticket 1.2

### Title

`Deploy a single-instance Prometheus stack in k3s`

### Goal

Deploy Prometheus as a right-sized, single-instance monitoring service.

### Scope

* install Prometheus through `kube-prometheus-stack` or an equivalent Helm chart;
* configure one Prometheus replica;
* configure one shard;
* attach a persistent volume;
* configure time-based and size-based retention;
* configure CPU and memory requests;
* configure CPU and memory limits;
* enable Kubernetes target discovery;
* enable monitoring of Prometheus itself.

### Out of scope

* HPA;
* sharding;
* multiple Prometheus replicas;
* Thanos;
* remote write;
* long-term object storage.

### Acceptance criteria

* Prometheus runs as one pod;
* Prometheus survives pod restarts without losing its active local storage;
* Prometheus discovers Kubernetes targets;
* retention limits are configured;
* resource limits are configured;
* no HPA is created for Prometheus;
* Prometheus health is visible in its own metrics.

### Relations

Blocked by the observability ADR.

---

## Ticket 1.3

### Title

`Deploy Grafana and provision monitoring data sources`

### Goal

Provide a central interface for infrastructure and application monitoring.

### Scope

* deploy one Grafana instance;
* configure Prometheus as a data source;
* configure Loki as a data source after Loki becomes available;
* provision dashboards from repository files;
* configure persistent storage or external configuration storage;
* protect Grafana access;
* disable anonymous administrative access;
* document credentials management.

### Acceptance criteria

* Grafana is accessible through a protected endpoint;
* Prometheus is automatically configured as a data source;
* dashboards are provisioned from code;
* manual dashboard changes are not the only source of truth;
* Grafana configuration survives pod restarts.

### Relations

Blocked by the Prometheus deployment.

---

## Ticket 1.4

### Title

`Standardize structured JSON logging across backend services`

### Goal

Ensure backend logs can be reliably collected and searched.

### Scope

Create a shared logging format containing fields such as:

```json
{
  "timestamp": "2026-07-14T20:15:31Z",
  "level": "INFO",
  "service": "restorio-api",
  "environment": "production",
  "version": "1.8.2",
  "git_sha": "abc123",
  "message": "Order payment completed",
  "request_id": "request-id",
  "trace_id": "trace-id",
  "tenant_id": "tenant-id",
  "route": "/api/v1/payments/callback",
  "duration_ms": 183
}
```

Implement:

* JSON logging to stdout;
* consistent log levels;
* request ID propagation;
* application version fields;
* Git commit fields;
* exception formatting;
* secret redaction;
* personally identifiable information handling rules.

### Out of scope

* writing logs directly to files inside application containers;
* sending logs through Kafka;
* storing complete payment provider payloads;
* storing authentication tokens.

### Acceptance criteria

* production backend logs are valid JSON;
* every request log contains a request ID;
* application version and commit SHA are included;
* secrets and authorization headers are not logged;
* logs are written to stdout;
* logging failures do not break API requests.

---

## Ticket 1.5

### Title

`Deploy Grafana Loki for centralized log storage`

### Goal

Store and query logs generated by Kubernetes workloads.

### Scope

* deploy Loki;
* define single-binary or simple-scalable mode appropriate for the cluster size;
* configure retention;
* configure persistent storage or MinIO object storage;
* configure resource requests and limits;
* protect the Loki endpoint;
* document storage and recovery behavior.

### Acceptance criteria

* Loki receives logs from the cluster;
* logs are queryable from Grafana;
* retention is configured;
* storage consumption is controlled;
* Loki is not publicly accessible;
* failure of Loki does not stop application workloads.

### Relations

Blocked by the observability ADR.

---

## Ticket 1.6

### Title

`Deploy Grafana Alloy as the Kubernetes log collector`

### Goal

Collect container logs from all k3s nodes and forward them to Loki.

### Scope

* deploy Alloy as a DaemonSet;
* discover Kubernetes pods;
* collect stdout and stderr logs;
* parse structured JSON logs;
* attach stable Kubernetes metadata;
* forward logs to Loki;
* exclude unnecessary system noise where justified;
* configure retry and buffering behavior.

### Label rules

Allow low-cardinality labels such as:

* service;
* environment;
* namespace;
* cluster;
* application version.

Do not use high-cardinality Loki labels such as:

* user ID;
* tenant ID;
* request ID;
* order ID;
* trace ID;
* session ID.

These fields must remain inside the structured log body.

### Acceptance criteria

* Alloy runs on every k3s node;
* application logs appear in Loki;
* logs contain Kubernetes workload metadata;
* high-cardinality identifiers are not used as Loki labels;
* temporary Loki outages do not crash application containers.

### Relations

Blocked by Loki and structured logging tickets.

---

## Ticket 1.7

### Title

`Instrument the FastAPI backend with Prometheus metrics`

### Goal

Expose application-level metrics for the Restorio API.

### Scope

Add metrics for:

* HTTP request count;
* HTTP response status;
* request duration;
* request size;
* response size;
* active requests;
* unhandled exceptions;
* active WebSocket connections;
* authentication failures;
* rate-limit rejections;
* payment callback failures;
* order processing failures;
* database connection pool status.

Expose metrics through a protected or internally accessible `/metrics` endpoint.

### Metric label rules

Allowed labels may include:

* method;
* normalized route;
* response status;
* service;
* version.

Do not use labels containing:

* user ID;
* tenant ID;
* order ID;
* payment ID;
* raw URL;
* e-mail address.

### Acceptance criteria

* Prometheus successfully scrapes the API;
* metrics use normalized routes;
* metrics do not expose personal data;
* application version is available as metric metadata;
* metrics instrumentation does not significantly affect API latency;
* tests validate the metrics endpoint.

---

## Ticket 1.8

### Title

`Add Kubernetes and infrastructure exporters`

### Goal

Monitor the platform components used by Restorio.

### Scope

Configure monitoring for:

* Kubernetes nodes;
* Kubernetes pods;
* Deployments;
* StatefulSets;
* Jobs;
* persistent volumes;
* ingress;
* PostgreSQL;
* MongoDB;
* MinIO;
* certificate expiration;
* disk usage.

Use supported exporters or native metrics endpoints.

### Acceptance criteria

* all production nodes are visible;
* pod restart counts are visible;
* persistent volume usage is visible;
* PostgreSQL connection and query metrics are visible;
* MongoDB health metrics are visible;
* MinIO storage metrics are visible;
* exporter credentials are stored securely.

---

## Ticket 1.9

### Title

`Create Restorio operational Grafana dashboards`

### Goal

Create version-controlled dashboards for the production platform.

### Required dashboards

#### Platform overview

* node CPU;
* node memory;
* node disk usage;
* unavailable pods;
* pod restarts;
* persistent volume usage.

#### API overview

* requests per second;
* error rate;
* p50 response time;
* p95 response time;
* p99 response time;
* slowest routes;
* API version.

#### Storage overview

* PostgreSQL connections;
* PostgreSQL query duration;
* MongoDB health;
* MinIO usage;
* available disk space.

#### Release health

* currently deployed application versions;
* error rate by version;
* request duration by version;
* restart count by version.

### Acceptance criteria

* dashboards are stored in the repository;
* dashboards are provisioned automatically;
* dashboards can filter by environment;
* dashboards can filter by service;
* dashboards show the deployed application version.

### Relations

Blocked by metrics, exporters, Prometheus, and Grafana tickets.

---

## Ticket 1.10

### Title

`Configure Alertmanager and production alert rules`

### Goal

Notify maintainers about actionable production failures.

### Initial alerts

* API unavailable;
* high API error rate;
* high API response time;
* pod crash loop;
* repeated container restarts;
* node unavailable;
* low disk space;
* persistent volume nearly full;
* PostgreSQL unavailable;
* MongoDB unavailable;
* MinIO unavailable;
* certificate close to expiration;
* Prometheus scrape failures;
* Prometheus storage nearly full;
* failed backup;
* payment callback failure spike.

### Scope

* deploy one Alertmanager instance;
* configure notification receiver;
* group related alerts;
* configure inhibition rules;
* avoid duplicate notifications;
* add runbook links;
* define warning and critical thresholds.

### Acceptance criteria

* test alerts reach the configured receiver;
* every critical alert contains a runbook link;
* alerts describe the affected service and environment;
* non-actionable alerts are avoided;
* application versions are included where relevant.

### Relations

Blocked by Prometheus, exporters, and dashboards.

---

## Ticket 1.11

### Title

`Define service level indicators and service level objectives`

### Goal

Define measurable reliability expectations for Restorio.

### Scope

Define initial SLIs and SLOs for:

* API availability;
* API latency;
* payment callback processing;
* order submission;
* kitchen update delivery;
* public mobile application availability.

Example initial targets may be proposed but must be reviewed before acceptance.

Define:

* measurement window;
* error budget;
* excluded traffic;
* alerting thresholds;
* dashboard representation.

### Acceptance criteria

* each critical user flow has an SLI;
* SLOs are documented;
* SLO metrics are available in Prometheus;
* Grafana contains an SLO dashboard;
* alert rules use burn-rate or equivalent meaningful thresholds where appropriate.

---

## Ticket 1.12

### Title

`Add observability deployment validation and runbooks`

### Goal

Ensure the monitoring stack can be maintained during failures.

### Scope

Create runbooks for:

* Prometheus unavailable;
* Grafana unavailable;
* Loki unavailable;
* Prometheus disk full;
* Loki storage full;
* missing scrape targets;
* excessive log volume;
* alert delivery failure;
* exporter failure;
* recovery after node replacement.

Add smoke tests for:

* Prometheus target health;
* Grafana data source connectivity;
* Loki ingestion;
* Alloy log forwarding;
* Alertmanager notification delivery.

### Acceptance criteria

* all critical monitoring components have runbooks;
* smoke tests run after deployment;
* a failed smoke test marks deployment as unsuccessful;
* recovery procedures do not require undocumented manual knowledge.

---

# EPIC 2: Event-Driven Processing Evaluation

## Title

`[EPIC] Event-Driven Processing Evaluation and Foundation`

## Goal

Evaluate whether Kafka-compatible event streaming provides sufficient value for Restorio and prepare a minimal event-processing foundation for selected asynchronous workflows.

## Context

Kafka or Redpanda may provide value for:

* analytics ingestion;
* notification delivery;
* order lifecycle events;
* payment events;
* CMS publication events;
* asynchronous integrations.

Kafka must not be introduced only for architectural complexity.

The initial implementation should focus on one justified use case.

The preferred first candidates are:

1. analytics event processing;
2. notification delivery.

## Out of scope

* using Kafka for centralized application logs;
* replacing REST API communication;
* converting every backend module into a microservice;
* implementing full event sourcing;
* making Kafka the source of truth for financial data;
* publishing directly to Kafka without transactional consistency.

---

## Ticket 2.1

### Title

`[ADR] Evaluate Kafka, Redpanda, RabbitMQ and database-backed queues`

### Goal

Select the appropriate asynchronous processing technology for Restorio.

### Scope

Compare:

* Apache Kafka;
* Redpanda;
* RabbitMQ;
* PostgreSQL-backed jobs;
* Redis-based queues;
* no broker.

Evaluate:

* operational complexity;
* k3s deployment;
* resource usage;
* delivery guarantees;
* event replay;
* ordering;
* consumer groups;
* schema management;
* observability;
* backup and recovery;
* development experience;
* suitability for analytics;
* suitability for notifications.

### Acceptance criteria

* an ADR compares all alternatives;
* one initial use case is selected;
* operational cost is documented;
* the decision includes clear go/no-go criteria;
* Kafka-compatible streaming is not selected without a concrete use case.

---

## Ticket 2.2

### Title

`Define event naming, envelope and versioning conventions`

### Goal

Create consistent contracts for asynchronous business events.

### Scope

Define an event envelope containing:

```json
{
  "event_id": "uuid",
  "event_type": "payment.completed",
  "event_version": 1,
  "occurred_at": "2026-07-14T20:15:31Z",
  "producer": "restorio-api",
  "producer_version": "1.8.2",
  "tenant_id": "tenant-id",
  "correlation_id": "correlation-id",
  "causation_id": "causation-id",
  "payload": {}
}
```

Define conventions for:

* event names;
* schema versions;
* timestamps;
* tenant isolation;
* correlation IDs;
* causation IDs;
* event IDs;
* compatibility;
* deprecation;
* sensitive fields;
* replay behavior.

### Acceptance criteria

* event conventions are documented;
* event schemas are versioned;
* events include producer version;
* events do not contain authentication secrets;
* breaking schema changes require a new version;
* tenant-scoped events always include tenant context.

### Relations

Blocked by the event-processing ADR.

---

## Ticket 2.3

### Title

`Create a shared versioned event schema package`

### Goal

Provide typed event contracts shared by producers and consumers.

### Scope

* create a shared package or generated contracts;
* define base event envelope;
* define validation;
* define serialization format;
* add compatibility tests;
* document schema evolution;
* add example producer and consumer tests.

### Acceptance criteria

* invalid events are rejected;
* producer and consumer contracts are tested;
* schemas have explicit versions;
* generated or shared contracts are not duplicated across services;
* schema changes are checked in CI.

### Relations

Blocked by event convention definitions.

---

## Ticket 2.4

### Title

`Deploy a single-node Redpanda proof of concept in staging`

### Goal

Validate Kafka-compatible event streaming without introducing production dependency.

### Scope

* deploy Redpanda in staging;
* deploy Redpanda Console;
* configure persistent storage;
* configure authentication;
* configure TLS if required;
* expose internal metrics;
* connect Prometheus;
* define resource requests and limits;
* test producer and consumer behavior;
* test restart behavior;
* test event replay.

### Out of scope

* production deployment;
* multi-node Redpanda cluster;
* moving critical order processing to the broker.

### Acceptance criteria

* a producer can publish a test event;
* a consumer can read the event;
* consumer groups work correctly;
* restart behavior is documented;
* metrics are visible in Prometheus;
* the PoC includes measured CPU, memory, and disk usage;
* the ADR is updated with PoC conclusions.

### Relations

Blocked by the ADR and event schema package.

---

## Ticket 2.5

### Title

`Implement a PostgreSQL transactional outbox`

### Goal

Guarantee that database state changes and event publication requests are recorded atomically.

### Scope

Create an outbox table containing:

* event ID;
* event type;
* event version;
* aggregate ID;
* tenant ID;
* payload;
* creation timestamp;
* publication status;
* retry count;
* published timestamp;
* failure details.

Insert business state and outbox event in the same PostgreSQL transaction.

### Out of scope

Do not implement:

```text
save database record
then publish directly to Kafka
```

as the only consistency mechanism.

### Acceptance criteria

* business data and outbox record are committed atomically;
* rollback removes both changes;
* duplicate publication can be detected;
* outbox records are tenant-aware;
* failed events remain available for retry;
* retention rules are documented.

### Relations

Blocked by the event schema package.

Related to the existing PostgreSQL architecture issues.

---

## Ticket 2.6

### Title

`Implement a reliable outbox publisher`

### Goal

Publish pending outbox events to the selected broker.

### Scope

* poll pending outbox records;
* publish versioned events;
* update publication state;
* implement retry with backoff;
* avoid parallel duplicate processing;
* expose publisher metrics;
* add structured logs;
* support graceful shutdown;
* handle broker outages.

### Acceptance criteria

* broker failure does not lose outbox events;
* successfully published events are marked as published;
* publisher restarts do not lose pending work;
* duplicate publication is possible but documented;
* consumers are required to be idempotent;
* publisher lag is visible in Prometheus.

### Relations

Blocked by the transactional outbox and staging broker PoC.

---

## Ticket 2.7

### Title

`Create an idempotent consumer framework`

### Goal

Ensure consumers safely handle duplicate event delivery.

### Scope

* processed event ID storage;
* atomic consumer-side processing;
* duplicate detection;
* retry handling;
* failure classification;
* metrics;
* structured logs;
* correlation ID propagation;
* graceful shutdown.

### Acceptance criteria

* processing the same event twice does not duplicate the business effect;
* failed events can be retried;
* processed event IDs have a retention policy;
* consumer lag and failures are monitored;
* duplicate events are visible in metrics.

### Relations

Blocked by the shared event schema package.

---

## Ticket 2.8

### Title

`Define retry topics and dead-letter handling`

### Goal

Provide a controlled process for events that cannot be processed.

### Scope

Define:

* retry count;
* retry backoff;
* retry topic naming;
* dead-letter topic naming;
* error metadata;
* operator replay;
* poison message handling;
* alerting;
* retention.

### Acceptance criteria

* repeatedly failing events do not block an entire partition;
* dead-letter events retain the original event ID;
* operators can inspect failures;
* replay is documented;
* critical dead-letter events trigger alerts.

### Relations

Blocked by the consumer framework.

---

## Ticket 2.9

### Title

`Implement analytics events as the first broker use case`

### Goal

Validate the event platform through non-critical analytics processing.

### Scope

Publish selected events such as:

* mobile page viewed;
* menu viewed;
* product viewed;
* cart created;
* checkout started;
* payment completed;
* CMS page published.

Create a consumer that stores validated analytics events in the selected analytics storage.

### Out of scope

* blocking checkout when analytics is unavailable;
* storing authentication tokens;
* storing complete payment payloads;
* relying on analytics for financial reconciliation.

### Acceptance criteria

* analytics failure does not affect checkout;
* duplicate events do not duplicate analytics records;
* invalid event schemas are rejected;
* consent requirements are enforced;
* event lag is visible in Grafana;
* replay produces deterministic results.

### Relations

Blocked by outbox publisher, consumer framework, and retry handling.

Related to the custom analytics epic if it already exists.

---

## Ticket 2.10

### Title

`Evaluate asynchronous notification delivery as the second broker use case`

### Goal

Determine whether e-mail, push, webhook, and future SMS notifications should use the event platform.

### Scope

Evaluate events such as:

* order confirmed;
* order ready;
* payment completed;
* payment failed;
* password reset requested;
* CMS publication completed.

Define:

* notification request event;
* notification delivery status;
* retry behavior;
* provider failure handling;
* tenant templates;
* idempotency;
* delivery metrics.

### Acceptance criteria

* the design separates notification requests from provider delivery;
* notifications cannot be duplicated by repeated event delivery;
* provider failures have retry limits;
* permanent failures are visible to operators;
* no production implementation is required before the design is accepted.

### Relations

Blocked by the initial analytics use case results.

---

## Ticket 2.11

### Title

`Add Redpanda and consumer monitoring to Prometheus and Grafana`

### Goal

Provide operational visibility into the event-processing platform.

### Scope

Monitor:

* broker availability;
* disk usage;
* partition count;
* under-replicated partitions if applicable;
* message throughput;
* consumer lag;
* outbox backlog;
* publish failures;
* consumer failures;
* dead-letter event count;
* replay operations.

### Acceptance criteria

* broker health is visible in Grafana;
* consumer lag has warning and critical alerts;
* outbox backlog is monitored;
* dead-letter growth triggers an alert;
* dashboards display consumer and producer versions.

### Relations

Blocked by the Redpanda PoC and observability epic.

---

## Ticket 2.12

### Title

`Document event replay, recovery and broker failure procedures`

### Goal

Ensure the event platform can be operated safely.

### Scope

Create runbooks for:

* broker unavailable;
* publisher backlog;
* consumer lag;
* poison event;
* dead-letter replay;
* accidental replay;
* schema incompatibility;
* storage full;
* lost consumer state;
* restoring staging data;
* disabling event publication safely.

### Acceptance criteria

* replay procedures include safeguards;
* operators can identify the original event version;
* replay does not bypass tenant isolation;
* recovery procedures are tested in staging;
* critical order and payment data remain recoverable from the system of record.

---

# Required dependency order

## Observability epic

1. Observability ADR.
2. Prometheus.
3. Grafana.
4. Structured JSON logging.
5. Loki.
6. Alloy.
7. FastAPI metrics.
8. Infrastructure exporters.
9. Dashboards.
10. Alertmanager.
11. SLOs.
12. Runbooks and smoke tests.

## Event-processing epic

1. Technology ADR.
2. Event conventions.
3. Event schema package.
4. Redpanda staging PoC.
5. Transactional outbox.
6. Outbox publisher.
7. Idempotent consumer framework.
8. Retry and dead-letter handling.
9. Analytics use case.
10. Notification evaluation.
11. Monitoring.
12. Recovery runbooks.

# Final report

After creating and linking all issues, return:

1. links to both epics;
2. child issue links grouped by epic;
3. dependency order;
4. detected duplicate issues;
5. issues skipped because an equivalent already exists;
6. missing labels;
7. total number of created epics;
8. total number of created child issues;
9. confirmation that every created issue is written entirely in English.
