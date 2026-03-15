# MVP Polish Locale Lock Rollback Guide

This project is currently hard-locked to Polish (`pl`) for MVP in:
- `admin-panel`
- `public-web`

This document explains how to revert to the original dynamic i18n behavior.

## Files Changed For MVP Lock

### Admin panel
- `app/apps/admin-panel/src/wrappers/AppProviders.tsx`
- `app/apps/admin-panel/src/features/sidebar/AdminSidebar.tsx`

### Public web
- `app/apps/public-web/app/page.tsx`
- `app/apps/public-web/src/wrappers/AppProviders.tsx`
- `app/apps/public-web/src/i18n/routing.ts`
- `app/apps/public-web/src/i18n/request.ts`

## What Was Changed

1. Locale state/detection was bypassed and forced to `pl`.
2. Language switch UI was disabled (admin sidebar now shows static `PL`).
3. Public root route (`/`) now always redirects to `/pl`.
4. `next-intl` routing/request locale config was reduced to only `["pl"]`.

## Rollback Steps

## 1. Restore Admin Dynamic Locale

In `app/apps/admin-panel/src/wrappers/AppProviders.tsx`:
- Re-enable `resolveLocale` import.
- Re-enable `useMemo` import.
- Re-enable locale state initialization:
  - `const [locale, setLocale] = useState(() => resolveLocale(...))`
- Re-enable memoized messages:
  - `const messages = useMemo(() => getMessages(locale), [locale])`
- Restore `I18nProvider` prop:
  - `setLocale={setLocale}`
- Remove forced:
  - `const locale = "pl";`
  - `setLocale={() => { ... }}`

In `app/apps/admin-panel/src/features/sidebar/AdminSidebar.tsx`:
- Re-add `LanguageDropdown` import from `@restorio/ui`.
- Re-add `supportedLocales` import from `../../i18n/messages`.
- Re-add `useId` and locale handlers from `useI18n()`:
  - `const { t, locale, setLocale } = useI18n();`
- Replace static `PL` badge with `LanguageDropdown` block.

## 2. Restore Public Root Locale Redirect Logic

In `app/apps/public-web/app/page.tsx`:
- Re-add:
  - `hasLocale` from `next-intl`
  - `getLocale` from `next-intl/server`
  - `routing` from `../src/i18n/routing`
- Replace `redirect("/pl")` with:
  - detect locale via `getLocale()`
  - resolve with `hasLocale(...) ? detectedLocale : routing.defaultLocale`
  - redirect to resolved locale

## 3. Restore Public i18n Provider Locale Source

In `app/apps/public-web/src/wrappers/AppProviders.tsx`:
- Re-enable `useLocale` import from `next-intl`.
- Restore:
  - `const locale = useLocale();`
- Remove forced:
  - `const locale = "pl";`

## 4. Restore next-intl Routing Config

In `app/apps/public-web/src/i18n/routing.ts`:
- Restore:
  - `locales: ["en", "pl", "es", "ar"]`
  - `localeDetection: true`
- Remove forced:
  - `locales: ["pl"]`
  - `localeDetection: false`

In `app/apps/public-web/src/i18n/request.ts`:
- Restore:
  - `locales = ["en", "pl", "es", "ar"] as const`
  - `defaultLocale` (whatever you want as product default; historically `en`)
- Keep `notFound()` guard for unsupported locales.

## 5. Verify

From repo root:

```bash
bunx tsc -p app/apps/admin-panel/tsconfig.json --noEmit
bunx tsc -p app/apps/public-web/tsconfig.json --noEmit
```

Optional runtime checks:
- `/` redirects based on detected/selected locale (not always `/pl`)
- admin language dropdown is visible and changes locale
- public pages load correctly for `en/pl/es/ar`
