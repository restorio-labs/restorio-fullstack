# Structured backend logging

Issue [#205](https://github.com/restorio-labs/restorio-fullstack/issues/205) defines the API log contract.
All application logs are JSON lines written to standard output.
The container runtime is responsible for collection.

Every log record contains `timestamp`, `level`, `service`, `environment`, `version`, `git_sha`, and `message`.
Logs emitted while handling an HTTP request also contain `request_id`.
The API accepts a valid `X-Request-ID` header or generates a UUID and returns it in the response.
An optional valid `X-Trace-ID` header is propagated in the same way.
Request completion logs add `route`, `http_method`, `http_status`, and `duration_ms`.
Audit and authorization events may add stable `user_id` and `tenant_id` identifiers when required for operational correlation.

The API image supplies `VERSION` and `GIT_SHA` from its build metadata.
Development runs use `unknown` when no commit SHA is provided.

## Data handling rules

Never log passwords, credentials, secrets, API keys, authentication tokens, authorization headers, cookies, payment card data, complete payment provider payloads, email addresses, client IP addresses, or user-agent strings.
The shared formatter redacts sensitive field names and common secret-bearing message patterns before writing JSON.
Audit events deliberately record only operational identifiers, event names, routes, and policy decisions.
Do not add raw request bodies, query parameters, headers, or exception data structures as log extras.
Use typed, allowlisted log fields instead.

Logging failures must not change an API response or request outcome.
The logging handler suppresses write failures and emits a minimal valid JSON record if formatting fails.
