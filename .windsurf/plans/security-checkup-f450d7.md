# Security Checkup: Frontend + API Combined Assessment

Comprehensive security audit of the Restorio fullstack application covering API backend vulnerabilities and frontend packaging/bundle security.

---

## Executive Summary

The recent security fixes (websocket auth, trusted proxy IP, CSRF middleware) have addressed critical vulnerabilities. However, several **high-priority gaps remain**, particularly around tenant authorization on restaurant-scoped routes and payment creation endpoints.

---

## API Security Findings

### Critical: Missing Tenant Authorization on Orders Routes
**File:** `app/api/routes/v1/orders.py`
**Status:** ❌ NOT PROTECTED

All order endpoints (`/{restaurant_id}/orders/*`) lack authentication and tenant authorization:
- `GET /{restaurant_id}/orders` - List orders
- `GET /{restaurant_id}/orders/{order_id}` - Get order
- `POST /{restaurant_id}/orders` - Create order
- `PATCH /{restaurant_id}/orders/{order_id}/status` - Update status
- `DELETE /{restaurant_id}/orders/{order_id}` - Delete order
- `POST /{restaurant_id}/orders/{order_id}/archive` - Archive order
- `POST /{restaurant_id}/orders/{order_id}/refund` - Refund order

**Risk:** Any unauthenticated user can read, create, modify, or delete orders for any restaurant.

**Fix:** Add `AuthorizedTenantId` dependency to all endpoints.

---

### Critical: Missing Tenant Authorization on Kitchen Config Routes
**File:** `app/api/routes/v1/kitchen_config.py`
**Status:** ❌ NOT PROTECTED

Kitchen config endpoints lack authentication:
- `GET /{restaurant_id}/kitchen-config`
- `PUT /{restaurant_id}/kitchen-config/rejection-labels`

**Risk:** Any user can read/modify kitchen configuration for any restaurant.

**Fix:** Add `AuthorizedTenantId` dependency and role guards for write operations.

---

### Critical: Missing Tenant Authorization on Menu Routes
**File:** `app/api/routes/v1/tenants/menu.py`
**Status:** ❌ NOT PROTECTED

Menu endpoints lack authentication:
- `GET /{tenant_public_id}/menu` - Read menu
- `PUT /{tenant_public_id}/menu` - Update entire menu
- `PATCH /{tenant_public_id}/menu/categories/{category_order}/items/{item_name}/availability` - Toggle availability

**Risk:** Any user can read/modify menus for any tenant.

**Fix:** Add `AuthorizedTenantId` for write operations. Decide if menu read should be public (for customer-facing apps) or protected.

---

### High: Cross-Tenant Payment Creation
**File:** `app/api/routes/v1/payments/payments.py`
**Status:** ⚠️ PARTIALLY VULNERABLE

The `/payments/create` endpoint accepts `tenant_id` from the request body without verifying the caller has access to that tenant:
```python
async def create_payment(request: CreateTransactionDTO, ...):
    tenant = await tenant_service.get_tenant(session, request.tenant_id)  # No auth check!
```

**Risk:** Authenticated users can initiate payments for any tenant.

**Fix:** Either:
1. Add `AuthorizedTenantId` dependency and validate against request body
2. Move endpoint under tenant-scoped route: `/tenants/{tenant_public_id}/payments/create`

---

### Medium: CORS Allows All Methods/Headers
**File:** `app/api/core/middleware/cors.py`
**Status:** ⚠️ OVERLY PERMISSIVE

```python
allow_methods=["*"],
allow_headers=["*"],
```

**Risk:** Broader attack surface than necessary.

**Fix:** Restrict to specific methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`) and headers.

---

### Low: Debug Mode Exposes API Docs
**File:** `app/api/main.py`
**Status:** ℹ️ INFORMATIONAL

OpenAPI docs are exposed when `DEBUG=True`. Ensure this is disabled in production.

---

## Recently Fixed (Verified ✅)

| Issue | Status | File |
|-------|--------|------|
| Unauthenticated websocket | ✅ Fixed | `routes/v1/ws.py` |
| Spoofable client IP | ✅ Fixed | `core/foundation/client_ip.py` |
| Missing CSRF protection | ✅ Fixed | `core/middleware/csrf.py` |

---

## Frontend/Packaging Security Findings

### Fixed ✅: Sourcemaps Disabled
All tsup configs now have `sourcemap: false`.

### Fixed ✅: @restorio/ui Exports
Package exports now point to `dist/` instead of `src/`.

### Fixed ✅: Files Allowlists
All packages have `"files": ["dist"]` in package.json.

### Fixed ✅: Test Dependency Moved
`@testing-library/user-event` moved to devDependencies.

### Fixed ✅: Vite Aliases Removed
Apps no longer alias `@restorio/*` to package `src/` directories.

---

### Medium: API Client Sends Bearer Token + Cookies
**File:** `app/packages/api-client/src/client.ts`
**Status:** ⚠️ POTENTIAL ISSUE

The client sends both `Authorization: Bearer` header AND `withCredentials: true`:
```typescript
if (token && requestConfig.headers.Authorization === undefined) {
  requestConfig.headers.Authorization = `Bearer ${token}`;
}
// ...
withCredentials: true,
```

**Risk:** Redundant auth mechanisms could cause confusion. Backend should clearly document which takes precedence.

**Recommendation:** Document auth flow; consider removing Bearer header if cookies are primary.

---

### Low: Token Decoding in Frontend
**Files:** `app/packages/auth/src/storage.ts`, `app/packages/api-client/src/client.ts`
**Status:** ℹ️ INFORMATIONAL

Frontend decodes JWT to check expiry. This is acceptable for UX but:
- Never trust decoded claims for authorization decisions
- Backend must always validate tokens

---

## Implementation Plan

### Phase 1: Critical Route Protection (Immediate)

1. **Orders routes** - Add `AuthorizedTenantId` to all endpoints
2. **Kitchen config routes** - Add `AuthorizedTenantId` + `RequireOwnerOrManager` for writes
3. **Menu routes** - Add `AuthorizedTenantId` for writes (decide on read policy)
4. **Payment creation** - Validate tenant access before processing

### Phase 2: Hardening (Short-term)

5. **CORS tightening** - Restrict methods/headers to required set
6. **Document auth flow** - Clarify Bearer vs Cookie precedence

### Phase 3: Operational (Ongoing)

7. **Add security tests** - Verify unauthorized access returns 401/403
8. **Dependency audit** - Regular `npm audit` / `pip-audit` checks

---

## Test Verification Commands

After implementing fixes, verify with:

```bash
# Test unauthorized order access (should return 401)
curl -X GET http://localhost:8000/api/v1/restaurants/any-id/orders

# Test cross-tenant order access (should return 403)
curl -X GET http://localhost:8000/api/v1/restaurants/other-tenant/orders \
  -H "Authorization: Bearer <valid_token>"

# Test unauthorized menu write (should return 401)
curl -X PUT http://localhost:8000/api/v1/tenants/any-id/menu \
  -H "Content-Type: application/json" \
  -d '{"categories": []}'
```

---

## Files to Modify

| Priority | File | Change |
|----------|------|--------|
| Critical | `routes/v1/orders.py` | Add tenant auth |
| Critical | `routes/v1/kitchen_config.py` | Add tenant auth |
| Critical | `routes/v1/tenants/menu.py` | Add tenant auth for writes |
| High | `routes/v1/payments/payments.py` | Validate tenant access |
| Medium | `core/middleware/cors.py` | Restrict methods/headers |
