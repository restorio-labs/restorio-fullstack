# Dependency governance

## Automated coverage

Dependabot checks every dependency ecosystem used by this repository each Monday at 06:00 Europe/Warsaw time.

| Ecosystem | Locations | Lock or definition files |
|---|---|---|
| uv | `/app/api` | `pyproject.toml`, `uv.lock` |
| Bun | `/`, `/e2e` | `package.json`, workspace manifests, `bun.lock` |
| Docker | `/app/api`, `/app/apps/public-web`, `/nginx` | `Dockerfile` |
| Docker Compose | `/` | `docker-compose.yml`, `docker-compose.dev.yml` |
| GitHub Actions | `/` | `.github/workflows`, local action references |

Security updates are grouped by ecosystem so one compatible remediation can close duplicate manifest and lockfile alerts.
Minor and patch version updates are grouped for uv and Bun because they are normally compatible and still pass the full pull request checks.
Major updates remain separate so their migration and rollback risks are visible.

The dependency review workflow blocks pull requests that introduce a dependency with a known vulnerability of moderate severity or higher.
Repository administrators should configure `Dependency vulnerability review` as a required status check for `main`.

## Alert response

- Critical alerts must be triaged immediately and remediated before the next deployment
- High alerts must be triaged within one business day
- Moderate and low alerts must be triaged in the next scheduled dependency review
- A remediation must update both the manifest and its generated lockfile
- The smallest relevant test suite and lockfile consistency check must pass before merge
- An alert may be closed only after the fixed version is present on the default branch and GitHub has re-scanned it

Use `uv lock --check` in `app/api` to validate the Python lockfile.
Use `bun install --frozen-lockfile` at the repository root and in `e2e` to validate both Bun lockfiles.
Use `bun audit` at the repository root and `uvx pip-audit` against the exported uv resolution for an additional registry-backed audit when network access is available.

## Exceptions

Do not dismiss an alert only because the vulnerable code path appears unused.
An exception requires a linked issue with the advisory identifier, affected component and version, exploitability analysis, compensating controls, accountable owner, and expiry date.
The expiry date must be no later than 30 days for critical or high severity and 90 days for moderate or low severity.
Expired exceptions block releases until they are renewed or remediated.

### Active exceptions

#### React Router RSC mode

- Tracking issue: [#250](https://github.com/restorio-labs/restorio-fullstack/issues/250)
- Advisory: `GHSA-qwww-vcr4-c8h2`
- Affected dependency: `react-router` 7.18.2
- Exposure: Restorio uses declarative browser routing and does not expose React Router RSC server actions
- Compensating controls: RSC mode is not deployed, dependency review blocks new vulnerable dependencies, and Dependabot checks Bun weekly
- Owner: frontend maintainers
- Expiry: 2026-09-02

#### Frontend build tooling

- Tracking issue: [#249](https://github.com/restorio-labs/restorio-fullstack/issues/249)
- Advisories: remaining `brace-expansion`, `minimatch`, `picomatch`, and `esbuild` findings reported by `bun audit`
- Affected components: ESLint 8, Tailwind CSS 3, Tsup, and OpenNext development or build dependency chains
- Exposure: the affected packages process repository-controlled source, configuration, glob patterns, and CSS during development or CI rather than application requests
- Compensating controls: untrusted runtime input is not passed to these tools, builds run in isolated CI jobs, and dependency review blocks new vulnerable dependencies
- Owner: frontend and infrastructure maintainers
- High-severity expiry: 2026-09-02
- Moderate and low expiry: 2026-11-01

## Rollback

Revert the dependency update and its lockfile together if it causes a regression.
Reopening a known vulnerability requires an approved exception before deployment.
If no exception is approved, roll forward to another patched version instead.
