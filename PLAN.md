# Table Locking Design for Mobile + Waiter Flows

## Summary
Introduce a dedicated, tenant-scoped `table_sessions` / `table_locks` capability that treats table access as a short-lived operational lease, not a permanent state flag.

Recommended behavior:
- A mobile guest does **not** lock a table on QR open.
- A mobile session attempts to acquire a lock only when checkout/payment starts.
- An existing waiter-owned lock or active waiter order blocks mobile checkout.
- Waiters may unlock any table within their tenant.
- Every lock auto-expires unless it is actively refreshed or finalized into an order/payment outcome.

This design minimizes malicious locking from outside, keeps tenant boundaries strict, supports waiter recovery, and prevents abandoned guest sessions from disturbing service.

## Key Changes

### Lock model and ownership
- Add a dedicated server-side lock/session record keyed by:
  - `tenant_id`
  - `table_ref` or canonical floor table id
  - `lock_token`
  - `origin` = `mobile` | `waiter`
  - `status` = `active` | `released` | `expired` | `completed`
  - `acquired_at`, `expires_at`, `last_seen_at`
  - optional metadata: `session_id`, `tenant_slug`, client fingerprint hash, IP hash, waiter user id
- Do **not** infer lock state from UI-only table occupation.
- Do **not** let public/mobile callers write arbitrary lock ownership fields.
- Keep one active lock per `(tenant, table)` enforced at the DB/query layer.

### When a mobile lock starts
- Keep QR open as read-only: menu/info may load freely without locking.
- On mobile checkout/payment start:
  - resolve `tenantSlug` to tenant
  - resolve requested table within that tenant
  - check for an existing active lock on that table
  - if waiter lock exists, reject with a clear “table unavailable / served by staff” response
  - if mobile lock exists and it belongs to the same client token, reuse/refresh it
  - otherwise reject or require retry after expiry
- Include “order is from mobile app” in the resulting order/session metadata so waiter/kitchen can see source.

### Preventing malicious permanent locks
- Public clients must receive an opaque lock token from the backend; never trust client-generated session ids as lock authority.
- Apply a short TTL:
  - recommended initial lease: 5-10 minutes
  - refresh only during meaningful activity such as checkout step progress or payment initiation
- Add abuse controls on public lock acquisition:
  - per-IP / per-device / per-tenant rate limits
  - dedupe repeated acquisition attempts from the same client and table
  - cooldown after repeated failed attempts
- Expire stale locks automatically:
  - server-side TTL cleanup job or read-time expiry enforcement
  - lock is invalid if `expires_at < now`
- Avoid “permanent lock until payment callback” because payment callbacks may fail, be delayed, or not exist yet in the current flow.

### Waiter and tenant isolation
- Tenant isolation:
  - every lock lookup and mutation must be filtered by tenant identity
  - public flows resolve tenant only from the public slug/QR context
  - waiter flows use authenticated tenant authorization, never public slug alone
- Table isolation:
  - a lock applies only to one resolved table in one tenant
  - identical table numbers in different tenants must never collide
  - prefer canonical table reference from floor layout/QR payload over plain table number alone
- Waiter capabilities:
  - waiters can see current lock owner/source for tables in their tenant
  - waiters can unlock any table in their tenant
  - every unlock is audit logged with waiter id, table, prior owner, and reason
- Conflict precedence:
  - waiter-origin lock wins over mobile-origin lock
  - mobile cannot override waiter occupancy
  - if waiter needs the table while a mobile lock is active, waiter unlock/override is immediate and authoritative

### Release and recovery rules
- Release lock on:
  - successful waiter/manual unlock
  - explicit guest cancellation
  - completed order handoff / payment finalized
  - expiry timeout
- Recovery paths:
  - if guest refreshes page and still has valid lock token, backend can rehydrate same mobile session
  - if guest loses token/session, treat as a new acquisition attempt
  - if payment starts but no completion callback arrives, release after TTL unless explicit verification succeeds
- Add a background reconciliation path later:
  - match payment transaction/session status against active mobile locks
  - mark `completed` or `expired` accordingly

## Public/API and UI Design

### Public/mobile API
- Add endpoints such as:
  - `POST /public/table-sessions/acquire`
  - `POST /public/table-sessions/refresh`
  - `POST /public/table-sessions/release`
  - or fold acquisition into checkout start if you want fewer roundtrips
- Recommended minimum response fields:
  - `lockToken`
  - `expiresAt`
  - `tableStatus`
  - `ownerType`
  - `message` when blocked
- On mobile checkout start:
  - return a specific conflict status when blocked by waiter/mobile lock
  - show a user-friendly message instead of silently proceeding

### Waiter API/UI
- Add waiter-authenticated endpoints for:
  - listing current active table locks for the tenant/floor
  - unlocking a table by table id/ref
- In waiter panel:
  - distinguish `occupied by waiter` vs `occupied by mobile`
  - show lock age and source
  - expose explicit unlock action with confirmation
- In floor view:
  - a table locked from mobile should appear occupied even if it was not created from waiter flow
  - unlocking should release the lock and optionally clear any linked pending mobile order/session

### QR/table identity
- Strengthen QR payload so the mobile app does not rely only on `tenantSlug + tableNumber`.
- Recommended QR identity:
  - tenant public id or slug
  - canonical table ref/id from floor layout
  - optional signed nonce/version
- If you want stronger anti-tampering later:
  - sign QR payload server-side and validate signature on public endpoints

## Test Plan
- Public/mobile acquisition:
  - QR open loads menu without locking
  - checkout start acquires lock when table is free
  - same client can refresh/reuse its own active lock
  - second public client is blocked while lock is active
- Waiter precedence:
  - waiter-locked table blocks mobile checkout
  - waiter can unlock mobile-origin lock
  - waiter unlock is tenant-scoped and cannot affect another tenant’s table
- Expiry and abuse:
  - stale lock expires and no longer blocks
  - repeated acquisition attempts trigger rate limiting
  - abandoned payment session does not leave a permanent lock
- Isolation:
  - same table number in different tenants does not collide
  - public slug/table combination cannot read or mutate another tenant’s lock
- Audit/visibility:
  - waiter unlock emits audit record
  - UI shows correct source and state for active lock

## Assumptions and Defaults
- Lock starts on mobile checkout/payment start, not on QR open.
- Waiter-origin occupancy or lock must block mobile checkout.
- Waiters can unlock any table within their tenant.
- A short lease with expiry is safer than permanent lock semantics.
- Payment-provider callback handling is not yet reliable enough to be the only release mechanism, so timeout-based recovery is required.
- “Best way” here prioritizes operational safety and abuse resistance over maximum exclusivity for guests.
