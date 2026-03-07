# Restorio Frontend - Remaining Improvements

**Last Updated:** March 2026  
**Status:** Consolidated from OpenAI and Anthropic audits, with completed items removed

---

## 1. Code Duplication

### 1.1 `AppLayout` — Duplicated Across 4 Apps ⚠️ HIGH PRIORITY

**Status:** Partially addressed — shared `BaseAppLayout` now exists in `@restorio/ui` and is used by `kitchen-panel`, `mobile-app`, and `waiter-panel`. The `admin-panel` layout still contains its own mobile-sidebar behavior and remains the main local variant.

Every app previously had its own `AppLayout` wrapper around `AppShell`:

| App | File | Extra Logic |
|---|---|---|
| `admin-panel` | `layouts/AppLayout.tsx` | Mobile sidebar toggle (88 lines) |
| `kitchen-panel` | `layouts/AppLayout.tsx` | Skip link only (25 lines) |

| `waiter-panel` | `layouts/AppLayout.tsx` | Minimal (16 lines) |
| `mobile-app` | `layouts/AppLayout.tsx` | Minimal (24 lines) |

**Remaining work:** Fold the `admin-panel` layout onto the shared base where practical, while preserving the mobile sidebar toggle behavior.

---

### 1.2 `AppProviders` — Partially Duplicated Across 4 Apps

`BrowserRouter + ThemeProvider` wrapper is copy-pasted into every Vite app. We've added `QueryClientProvider` to all 4, but the base structure is still duplicated.

**Recommendation:** Create `createAppProviders(options)` factory in `@restorio/utils` or add a composable `AppProviders` to `@restorio/ui` that accepts optional provider slots.

---

### 1.4 ENV Variable Parsing — Duplicated in Multiple Files ✅ PARTIALLY DONE

**Status:** `admin-panel` now has centralized `config.ts`, but other apps still duplicate ENV parsing.

**Remaining work:** Apply the same pattern to `kitchen-panel`, `waiter-panel`, `mobile-app`, and `public-web`.

---

### 1.7 `tailwind.config.ts` — Identical Across All Apps

Every app's Tailwind config is:
```ts
const config = createTailwindConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
});
```

**Recommendation:** Accept the content array as a parameter default in `createTailwindConfig`.

---

### 1.8 `vite.config.ts` Package Aliases Duplicated Across All Apps

All Vite apps repeat the same alias block:
```ts
alias: {
  "@restorio/types": resolve(__dirname, "../../packages/types/src"),
  "@restorio/ui": resolve(__dirname, "../../packages/ui/src"),
  ...
}
```

**Recommendation:** Export a `createViteAliases(__dirname)` helper from a workspace-level `tooling` package.

---

## 2. Missing Implementations / Placeholder Pages

### 2.1 `mobile-app` — Entirely Unimplemented ⚠️ HIGH PRIORITY

**Status:** Partially addressed — `mobile-app/src/App.tsx` now renders an explicit `Mobile App [WIP]` screen instead of only redirecting. The surface remains non-functional and should not be treated as production-ready.

**Action needed:** Implement the mobile app functionality.

---

### 2.2 `waiter-panel` — Restaurant List and Floor Never Connected 

**Status:** Fixed — `waiter-panel/src/App.tsx` now loads tenants through `api.tenants.list()`, links to `/restaurants/:restaurantId`, fetches tenant details with `api.tenants.get()`, and renders `FloorRuntimeView` for the selected restaurant.

**Remaining work:** Polish UI and handle edge cases.

---

### 2.3 `RestaurantCreatorPage`, `MenuCreatorPage`, `MenuPageConfiguratorPage` — All Placeholders ⚠️ HIGH PRIORITY

**Status:** Partially addressed — all three placeholder pages are now explicitly labeled `[WIP]` in the UI. These are still significant missing features in the admin panel.

---

### 2.4 Kitchen Panel Uses Only Mock Data

`kitchen-panel` imports `orders` from `../../mocks/orders` and never connects to the real API. This is fine for demo purposes but needs a clear flag and plan for real data integration.

---

### 2.5 `kitchen-panel` Auth Uses a 6-digit Access Code ⚠️ SECURITY

The `LoginView` in `kitchen-panel` sets the access token to a plain `"123-456"` format PIN and stores it in `localStorage`. This is **not production-ready** and is potentially a security concern.

---

## 3. Potential Bugs


### 3.2 `useColumnNavigation` Type Mismatch

```ts
// kitchen-panel/src/features/orders/hooks/useColumnNavigation.ts
export const useColumnNavigation = (
  statusKeys: OrderStatus[],  // accepts OrderStatus[]
```

But called with:
```ts
const statusKeys = useMemo(() => Object.keys(statusConfig) as StatusKey[], [statusConfig]);
```

The `as StatusKey[]` cast from `Object.keys()` returns `string[]` at runtime, hiding potential type unsafety.

---

### 3.4 `handlePointerMove` in `useDragAndDrop` Closes Over Stale `dragState`

```ts
const handlePointerMove = useCallback(
  (itemId: string) => (event: React.PointerEvent<HTMLElement>): void => {
    if (pointerIdRef.current !== event.pointerId || !dragState.startPosition) {
```

`dragState` is a dependency of `useCallback` but the closure captures the value at time of creation, potentially causing one-frame stutter.

---

### 3.5 `ActivateContent` Calls API Methods with Type Casts ⚠️ HIGH PRIORITY

**Status:** Fixed — stale type casts removed from `ActivateContent.tsx`. Calls now use `api.auth.resendActivation(activationId)` and `api.auth.setActivationPassword({...})` directly.

---

## 4. Architecture & Design Issues

### 4.1 `FloorLayoutEditorView` — Extremely Large Component (~750 lines) ⚠️ HIGH PRIORITY

**Status:** Partially addressed — `FloorLayoutEditorView` has been reduced substantially by extracting `FloorEditorToolbar`, `FloorEditorCanvas`, `FloorEditorInspector`, shared editor constants/helpers in `features/floor/editorShared.ts`, and keyboard/clipboard handling into `useFloorEditorKeyboard`.

Responsibilities mixed in a single component:
- layout editing logic
- history reducer
- keyboard handling
- drag/resize logic
- clipboard system
- selection system
- UI rendering
- palette generation
- element management
- toolbar actions

**Recommended refactor:**

```
features/floor
 ├ components
 │   ├ FloorEditorToolbar
 │   ├ FloorEditorCanvas
 │   ├ FloorEditorInspector
 │   ├ FloorResizeHandles
 │
 ├ hooks
 │   ├ useFloorEditor
 │   ├ useFloorClipboard
 │   ├ useFloorSelection
 │   ├ useFloorKeyboardShortcuts
 │
 ├ state
 │   ├ floorLayoutReducer
 │   ├ floorHistoryManager
```

**Remaining work:** Continue extracting state orchestration and drag/selection coordination hooks if deeper decomposition is still desired. The reducer/history behavior remains local and intact.

---

### 4.4 `public-web` Uses Both `next-intl` and `@restorio/ui`'s `I18nProvider`

In `public-web/src/wrappers/AppProviders.tsx`:
```tsx
const locale = useLocale();      // from next-intl
const messages = useMessages();  // from next-intl
return (
  <I18nProvider locale={locale} messages={messages}>  // from @restorio/ui
```

This bridges two i18n systems. Translations must be maintained in two formats.

**Recommendation:** Either make `@restorio/ui` components accept a translation injection mechanism, or unify on `next-intl` for `public-web`.

---

### 4.5 `admin-panel` i18n Default Locale Is `pl` but `public-web` Default Is `en`

```ts
// admin-panel/src/i18n/messages.ts
export const defaultLocale: SupportedLocale = "pl";

// public-web/src/i18n/request.ts
export const defaultLocale: Locale = "en";
```

Users navigating between the two apps will experience a language switch.

---

## 5. Testing Gaps

### 5.1 Only `PaymentConfigPage` Has Real Unit Tests in `admin-panel` ⚠️ HIGH PRIORITY

Critical untested areas:
- `TenantContext` state machine
- `FloorLayoutEditorView` keyboard shortcuts and drag behavior
- `useTenants` cache and refresh behavior (now using TanStack Query, but still untested)
- `useValidationErrors` field error mapping

---

### 5.2 `PaymentConfigPage` Tests Reference UI Text Without i18n Mock

The tests use:
```ts
screen.getByText(/selected restaurant/i)
screen.getByText(/p24 configuration updated successfully/i)
```

But `PaymentConfigPage` uses `t("payment.*")` translation keys. The test environment has no `I18nProvider`.

**Recommendation:** Add an `I18nProvider` wrapper in the test render helper, or mock `useI18n`.

---

### 5.3 No Integration or E2E Tests Exist ⚠️ HIGH PRIORITY

No Playwright, Cypress, or similar E2E setup is visible. For a multi-app product handling restaurant payments and order flows, at minimum the login → navigate → create-content flows should be covered.

---

## 6. Accessibility Issues

### 6.1 `QRCodeRow` Is a `<Link>` Containing a `<h3>` — Improper Heading Hierarchy

```tsx
<Link to={...}>
  <h3 className="text-lg font-semibold ...">Table {tableId}</h3>
  <img ... />
</Link>
```

If this component is rendered without a preceding `<h1>` or `<h2>`, it creates a broken heading hierarchy.

---

### 6.2 Color Picker Has No Meaningful Screen Reader Labels

```tsx
{zoneColors.map((hex) => (
  <button
    aria-label={t("floorEditor.aria.setColor", { color: hex })}
    style={{ backgroundColor: hex }}
  />
))}
```

The `aria-label` passes the raw hex color code (e.g., `"#4ade80"`). Screen reader users get no meaningful description.

**Recommendation:** Map hex values to human-readable color names.

---

### 6.3 Mobile Sidebar Backdrop Is a `<button>` Without Visible Focus Indicator

```tsx
<button
  type="button"
  className="fixed inset-0 z-dropdown bg-surface-overlay"
  aria-label={t("sidebar.mobile.closeMenu")}
  onClick={() => setIsMobileSidebarOpen(false)}
/>
```

A full-screen button with no visible focus state is an accessibility problem.

**Recommendation:** Use `role="dialog"` on the sidebar with `aria-modal="true"` and manage focus trapping.

---

### 6.4 `FloorLayoutEditorView` Keyboard Shortcuts Not Announced

Delete (Backspace/Delete key), Ctrl+C, and Ctrl+V keyboard shortcuts are implemented but not discoverable or announced to assistive technology users.

**Recommendation:** Add keyboard shortcut help overlay or `aria-live` announcements.

---

## 7. Performance Concerns

### 7.1 `FloorLayoutEditorView` Re-renders on Every Pointer Move

`onBoundsChange` dispatches `UPDATE_ELEMENT` which runs the full `layoutHistoryReducer` on every mouse move event during drag.

**Recommendation:** Batch drag updates using `requestAnimationFrame` or debounce the dispatch until pointer-up.

---

### 7.2 `zoneColors` Memo Depends on `colors` Object Reference

```ts
const zoneColors = useMemo(() => {
  const palette = ZONE_COLOR_SELECTORS.map((getColor) => getColor(colors)).filter(...)
  ...
}, [colors]);
```

If `useTheme` returns a new `colors` object reference on every render, `zoneColors` will recompute on every render.

**Recommendation:** Stabilize the `colors` reference in `useTheme` using `useMemo` inside the theme provider.

---

## 10. Recommended Priority Actions

### Immediate (block or high risk):
2. ✅ ~~Fix `ActivateContent` type casts~~ **DONE**
4. Implement or remove `mobile-app` (currently non-functional)
5. ✅ ~~Connect `waiter-panel` floor runtime to live restaurants~~ **DONE**
6. ✅ ~~Implement placeholder creator pages in `admin-panel` or mark as WIP~~ **WIP LABELED**

### Short-term cleanup:
7. ✅ ~~Centralize ENV config~~ **DONE for admin-panel**, extend to other apps
8. Deduplicate `AppLayout` / `AppProviders` (✅ `PageLayout` wrappers removed, ✅ shared `BaseAppLayout` extracted for simple apps)

### Medium-term improvements:
12. ✅ ~~Split `FloorLayoutEditorView`~~ **Recommended but not started**
13. Add unit tests for critical paths (TenantContext, FloorEditor, validation)
14. Set up E2E testing framework (Playwright/Cypress)
15. Improve accessibility (focus indicators, keyboard shortcuts help, color names)
16. Batch drag updates in FloorEditor for performance
17. Document `(public)` vs `(marketing)` layout grouping in `public-web`

---

**Estimated Remaining Work:** ~20 items across architecture, bugs, testing, and cleanup
