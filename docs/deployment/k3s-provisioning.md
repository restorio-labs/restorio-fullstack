# k3s environment provisioning

Issue [#149](https://github.com/restorio-labs/restorio-fullstack/issues/149) provisions the cluster boundary selected by ADR 0001.
Staging and production use separate VPS instances and separate single-node k3s clusters.

## Preconditions

The production VPS must meet the ADR minimum of 8 dedicated vCPU, 16 GiB RAM, and 250 GiB NVMe storage.
The staging VPS must provide at least 4 dedicated vCPU, 8 GiB RAM, and 100 GiB SSD storage.
Both hosts require a supported 64-bit Linux distribution using systemd and the `x86_64` architecture.

Before installation:

- patch the host operating system
- configure time synchronization
- disable password-based root login
- allow SSH only through the controlled operator path
- allow the Kubernetes API only through the private operator and CI network path
- allow public application traffic only on TCP 443
- verify that off-site backup credentials are not stored on the host image

The exact firewall or private-network product is provider-specific and must be documented in the environment inventory outside this repository.

## Install a server

The installer downloads a pinned k3s binary and verifies its SHA-256 digest before installing it.
Run it on the target host:

```bash
sudo infra/k3s/scripts/install-server.sh \
  staging \
  10.0.0.11 \
  k8s.staging.internal
```

For production, use the production node address and private API DNS name.
The DNS name must resolve only through the controlled administration path.

After k3s becomes ready, apply the environment boundary from an administrative workstation:

```bash
export KUBECONFIG=/secure/path/to/admin-kubeconfig
infra/k3s/scripts/apply-environment.sh staging
infra/k3s/scripts/validate-cluster.sh staging
```

Do not copy the administrative kubeconfig into GitHub Actions or another CI system.

## Restricted CI access

The `ci-deployer` ServiceAccount is bound to a Role in one application namespace.
It cannot create namespaces, RBAC bindings, cluster-scoped resources, or read another namespace.
It can manage the namespaced resource types needed by the Helm release in issue #150.
It cannot read or mutate application Secrets.
The Helm release must use the ConfigMap storage driver and refer to Secrets provisioned by the dedicated workflow from issue #151.

Generate its kubeconfig from an administrative workstation:

```bash
infra/k3s/scripts/create-ci-kubeconfig.sh \
  staging \
  https://k8s.staging.internal:6443 \
  /secure/tmp/restorio-staging-ci.kubeconfig
```

Store the file as an environment-scoped and protected CI secret, then securely remove the local copy.
Repeat the process independently for production.
Never reuse a service account token or kubeconfig between environments.

The generated token is intentionally limited by namespace RBAC but is long-lived because standalone k3s has no configured workload-identity federation.
Rotate it at least every 90 days and immediately after suspected exposure.
Delete the `ci-deployer-token` Secret and rerun the generator to rotate it.
A future identity-federation design may replace this token without expanding the Role.

## Capacity enforcement

Each environment applies a `ResourceQuota` and a `LimitRange`.
The limit range provides safe defaults, but issue #150 must still define deliberate requests and limits for every workload.
Defaults are not a substitute for measured sizing of PostgreSQL, MongoDB, MinIO, or the API.

The production quota deliberately leaves node capacity for k3s, ingress, storage operations, and observability.
Quota changes require capacity evidence and review.

## Upgrade policy

k3s is pinned in `infra/k3s/versions.env`.
Automated unattended k3s upgrades are not allowed.

For every upgrade:

1. Review the k3s and Kubernetes release notes, known issues, and version-skew policy.
2. Update the pinned version and release checksum in one pull request.
3. Validate all rendered manifests in CI.
4. Back up the staging cluster state and stateful application data.
5. Upgrade staging and run cluster, application, authentication, WebSocket, media, payment, and tenant-isolation smoke tests.
6. Observe staging for at least 24 hours.
7. Take and verify fresh production backups.
8. Schedule the production maintenance window and confirm the previous k3s binary and database restore points are available.
9. Upgrade production and run the same validation.
10. Record the installed version and test results.

Patch releases should be reviewed monthly and security releases immediately.
The platform must not skip more than one Kubernetes minor version in an upgrade.
When the installer replaces an existing binary, it retains the previous binary under `/var/lib/restorio/k3s-binaries` for controlled rollback.

## Cluster rebuild runbook

Use this procedure for total loss of the single production node.
The data restore details and commands belong to issue #153 and must be inserted before production cutover.

1. Declare an incident and stop DNS or ingress traffic that could create new writes.
2. Record the failed node, last known release digests, backup timestamps, and suspected failure cause.
3. Provision a clean VPS meeting the ADR capacity floor in the intended environment account.
4. Patch and harden the operating system and recreate the controlled private access path.
5. Run `install-server.sh` with the same environment and a reviewed k3s version.
6. Apply the environment overlay and validate the namespace and RBAC boundary.
7. Restore k3s configuration required by platform add-ons without restoring stale node identity.
8. Install the pinned platform releases for ingress, certificates, and observability.
9. Restore PostgreSQL, MongoDB, and MinIO from the selected coordinated restore point.
10. Deploy the application Helm revision using recorded image digests.
11. Generate a new restricted CI credential and revoke the credential from the failed cluster.
12. Run cluster, data, application, authentication, tenant-isolation, WebSocket, media, and payment smoke tests.
13. Restore traffic only after data consistency and application readiness are confirmed.
14. Measure achieved RPO and RTO and attach the evidence to the incident record.

The failed node must not rejoin the cluster after replacement without being wiped and reprovisioned.
