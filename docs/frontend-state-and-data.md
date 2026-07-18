# Frontend state, data, lists, and forms

Restorio uses a small set of focused libraries instead of one general-purpose state framework.
Each tool has one ownership boundary.

## Server state with TanStack Query

Backend data belongs in TanStack Query.
Do not mirror query results into Zustand or component state.
Do not fetch backend data from an effect.

Create one query client per application provider tree with the shared factory:

```tsx
import { createFrontendQueryClient } from "@restorio/api-client/query";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(createFrontendQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
```

The factory provides the workspace defaults for stale time, garbage collection, retry behavior, and window-focus refetching.
An application can override a specific default by passing a `QueryClientConfig` without losing the remaining shared defaults.

Query functions must forward TanStack Query's `AbortSignal` to the API client.
Mutations must invalidate or update the smallest stable query key that owns the changed data.
Upload requests to presigned third-party URLs are transport operations and do not need to go through the Restorio API query layer.

## UI state with Zustand

Use Zustand only for client-owned state shared by multiple components.
Suitable examples include view mode, selected restaurant, filters, temporary drafts, and panel visibility.

Do not put API responses, permissions, authentication truth, or business rules in a Zustand store.
Keep stores feature-local until two applications need the same store contract.
Use selectors so a component subscribes only to the state it renders.
Persist only state that is safe and useful after a reload.

## Large lists with TanStack Virtual

Virtualize lists and tables that can grow beyond one tablet viewport.
The kitchen order list and the admin staff list are the reference implementations.

Estimate row height conservatively, measure dynamic rows, and keep a small overscan window.
The scroll container must have a bounded height.
Keep accessible list or table semantics around the virtual rows.
Lazy-load feature routes so virtualization code is not included in unrelated entry chunks.

## Forms with React Hook Form

Use React Hook Form for production forms instead of one `useState` call per field.
The mobile checkout form is the reference for conditional fields and custom validation.

Shared controls from `@restorio/ui` forward refs and accept registration props.
Keep transport mutations outside the form component and pass validated values through an explicit submit callback.
Use `FormProvider` only when deeply nested fields need the form context.

## Application coverage

The admin, kitchen, mobile, and waiter applications create a TanStack Query client at their root.
The public website uses server components and route actions for server data, so it must not add a client query provider without a client-side data owner.
The UI demo has no backend state and intentionally has no query provider.
Both applications should add a library only when they add the corresponding runtime responsibility.

Redux and Redux Toolkit are not part of the frontend architecture.
A pull request introducing another state, query, form, or virtualization library must justify why the existing focused tool cannot meet the requirement.

## Bundle verification

The production builds on 17 July 2026 kept feature code behind the existing lazy route boundaries.
The shared `@restorio/api-client/query` ESM entry is 721 bytes before compression.
The mobile app's TanStack Query provider chunk is 13.50 kB raw and 4.68 kB gzip.
The virtualized admin staff route is 29.70 kB raw and 9.29 kB gzip, and it is not loaded by unrelated admin routes.
The standalone `@restorio/mobile` ESM build is 16.73 kB raw and remains outside application bundles until a consumer imports a screen.

These numbers are build snapshots rather than permanent budgets.
Re-run the relevant production build when changing providers, list primitives, or shared package exports.

## Review checklist

- Server data is owned by TanStack Query or a server component
- Query functions forward cancellation signals
- Zustand contains UI state only
- Large unbounded collections are virtualized
- Production forms use React Hook Form
- Feature-level libraries stay behind lazy route boundaries
- New imports use ESM entry points and preserve tree shaking
