---
name: Decouple Registration From Tenant
overview: Separate user registration from tenant/restaurant creation. Registration becomes email + password only. A new onboarding modal in the admin panel guides tenant-less users to create their first restaurant.
todos:
  - id: backend-migration
    content: Create Alembic migration to make ActivationLink.tenant_id nullable
    status: pending
  - id: backend-auth-service
    content: Add create_user method, update create_activation_link (optional tenant_id), update activate_account (handle no tenant)
    status: pending
  - id: backend-dto
    content: Update RegisterDTO (remove restaurant_name), RegisterCreatedData (remove tenant fields), ActivateResponseData (optional tenant_slug)
    status: pending
  - id: backend-routes
    content: Update register, activate, resend-activation routes for user-only flow
    status: pending
  - id: backend-email
    content: Update send_activation_email to handle no restaurant_name
    status: pending
  - id: backend-tenant-guard
    content: Update POST /tenants/ to allow authenticated users with no roles to create their first tenant
    status: pending
  - id: types-package
    content: Update RegisterRequest, RegisterCreatedData, TenantSlugData in packages/types
    status: pending
  - id: public-web-register
    content: Remove restaurantName field from RegisterContent.tsx and update translations
    status: pending
  - id: public-web-activate
    content: Update ActivateContent.tsx to handle no-tenant activation
    status: pending
  - id: admin-onboarding-modal
    content: Create OnboardingModal component with restaurant creation form
    status: pending
  - id: admin-integration
    content: Hook OnboardingModal into AdminShell, handle post-creation token refresh
    status: pending
  - id: admin-translations
    content: Add onboarding translations to all 4 admin-panel locales
    status: pending
isProject: false
---

# Decouple Registration from Tenant Creation

## Context

Currently, registration in public-web creates both a user AND a tenant (restaurant) in a single step via `create_user_with_tenant`. This couples two responsibilities. The goal is to make registration user-only, and move tenant creation to the admin panel as an onboarding step.

### Key constraint: `POST /tenants/` requires `RequireOwner` role, but a fresh user with no tenants has no `account_type` in their JWT. The role guard must allow tenant creation for role-less users.

---

## Phase 1: Backend Changes

### 1.1 Database Migration -- Make `ActivationLink.tenant_id` nullable

- File: new Alembic migration
- [ActivationLink model](app/api/core/models/activation_link.py): change `tenant_id` from `Mapped[UUID]` to `Mapped[UUID | None]`, set `nullable=True`

### 1.2 New `create_user` method in `AuthService`

- File: [auth_service.py](app/api/services/auth_service.py)
- Add `create_user(session, email, password) -> User` that creates a user with `is_active=False`, no tenant, no tenant role

### 1.3 Update `RegisterDTO` and `RegisterCreatedData`

- File: [auth DTO](app/api/core/dto/v1/auth/__init__.py)
- `RegisterDTO`: remove `restaurant_name` field
- `RegisterCreatedData`: remove `tenant_id`, `tenant_name`, `tenant_slug` fields

### 1.4 Update registration route

- File: [auth.py route](app/api/routes/v1/auth.py) `register()` endpoint
- Call new `create_user` instead of `create_user_with_tenant`
- Call `create_activation_link` with `tenant_id=None`
- Update `send_activation_email` call (no restaurant name)
- Update audit log call

### 1.5 Update `create_activation_link`

- File: [auth_service.py](app/api/services/auth_service.py)
- Make `tenant_id` parameter optional (`UUID | None = None`)

### 1.6 Update `activate_account`

- File: [auth_service.py](app/api/services/auth_service.py)
- Handle `tenant_id=None` case: only set `user.is_active = True`, skip tenant activation
- Return type changes: `tuple[Tenant | None, bool]`

### 1.7 Update `activate` route and `ActivateResponseData`

- File: [auth.py route](app/api/routes/v1/auth.py) `activate()` endpoint
- Handle no-tenant activation: create token with empty `tenant_ids` and no `account_type`
- [ActivateResponseData](app/api/core/dto/v1/auth/__init__.py): make `tenant_slug` optional (or return empty string)

### 1.8 Update `resend_activation_link`

- File: [auth_service.py](app/api/services/auth_service.py)
- Handle `tenant_id=None` case: skip tenant lookup, return `tuple[ActivationLink, Tenant | None]`
- Update [resend route](app/api/routes/v1/auth.py) accordingly

### 1.9 Update `send_activation_email`

- File: [email_service.py](app/api/services/email_service.py)
- Make `restaurant_name` optional, adjust email template for user-only activation

### 1.10 Update tenant creation auth -- allow role-less users

- File: [tenants.py route](app/api/routes/v1/tenants/tenants.py) `create_tenant()` endpoint
- Replace `RequireOwner` dependency with a custom guard that allows either `OWNER` role OR no roles at all (first tenant creation)
- After creating first tenant, the user gets an `OWNER` `TenantRole` via `TenantService.create_tenant`

---

## Phase 2: Frontend -- Shared Types (packages/types)

### 2.1 Update `RegisterRequest`

- File: [auth.ts](app/packages/types/src/auth.ts)
- Remove `restaurant_name` from interface

### 2.2 Update `RegisterCreatedData`

- File: [auth.ts](app/packages/types/src/auth.ts)
- Remove `tenant_id`, `tenant_name`, `tenant_slug`

### 2.3 Update `ActivateResponseData` / `TenantSlugData`

- Make `tenant_slug` optional if needed

---

## Phase 3: Frontend -- public-web

### 3.1 Simplify RegisterContent.tsx

- File: [RegisterContent.tsx](app/apps/public-web/app/[locale]/(public)/register/RegisterContent.tsx)
- Remove `restaurantName` state, validation, and form field
- Remove `restaurant_name` from API call payload

### 3.2 Update ActivateContent.tsx

- File: [ActivateContent.tsx](app/apps/public-web/app/[locale]/(public)/activate/ActivateContent.tsx)
- Handle activation response without tenant slug (redirect to admin panel directly)

### 3.3 Update translations (all 4 locales: en, pl, es, ar)

- Remove `register.fields.restaurantName` and `register.errors.restaurantNameRequired`

---

## Phase 4: Frontend -- admin-panel (Onboarding Modal)

### 4.1 Create `OnboardingModal` component

- New file: `app/apps/admin-panel/src/features/onboarding/OnboardingModal.tsx`
- Modal overlay (using existing `Modal` from `@restorio/ui`) that appears when user has 0 tenants
- Contains the restaurant creation form (restaurant name + address fields, similar to `RestaurantCreatorPage`)
- Uses `api.tenants.create()` -- but note: after first creation, user needs token refresh since their JWT won't have the new tenant. After creation, call `refreshTenants()` and potentially trigger a token refresh via `api.auth.refresh()`

### 4.2 Hook into AdminShell / TenantContext

- File: [App.tsx](app/apps/admin-panel/src/App.tsx) or AdminShell
- When `tenantsState === "loaded"` and `tenants.length === 0`, render `OnboardingModal`
- Modal should be non-dismissable (user must create a tenant to proceed)

### 4.3 Handle post-creation token refresh

- After first tenant creation in the modal, the JWT still has empty `tenant_ids` and no `account_type`
- Need to trigger a token refresh (call `POST /auth/refresh`) so the JWT gets updated with the new tenant
- Then call `refreshTenants()` to update the tenant context

### 4.4 Add translations (all 4 locales: en, pl, es, ar)

- Add `onboarding.*` keys for the modal title, description, form labels, and actions

---

## Files changed summary

**Backend (Python):**

- `app/api/core/models/activation_link.py`
- `app/api/core/dto/v1/auth/__init__.py`
- `app/api/services/auth_service.py`
- `app/api/services/email_service.py`
- `app/api/routes/v1/auth.py`
- `app/api/routes/v1/tenants/tenants.py`
- `app/api/core/foundation/role_guard.py` (or new guard)
- New migration file

**Frontend shared:**

- `app/packages/types/src/auth.ts`

**Frontend public-web:**

- `app/apps/public-web/app/[locale]/(public)/register/RegisterContent.tsx`
- `app/apps/public-web/app/[locale]/(public)/activate/ActivateContent.tsx`
- `app/apps/public-web/src/locales/{en,pl,es,ar}.json`

**Frontend admin-panel:**

- New: `app/apps/admin-panel/src/features/onboarding/OnboardingModal.tsx`
- `app/apps/admin-panel/src/App.tsx` (or AdminShell)
- `app/apps/admin-panel/src/locales/{en,pl,es,ar}.json`

