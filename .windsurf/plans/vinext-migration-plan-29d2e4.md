# Vinext Migration Plan

Migrating the existing Vite SPAs (`admin-panel`, `kitchen-panel`, etc.) to Vinext requires a significant architectural shift equivalent to migrating to Next.js, as Vinext implements the Next.js API surface rather than standard React SPA patterns.

## 📊 Effort Assessment: High / Significant
While Vinext is built on Vite, it expects a **Next.js architecture** (App Router or Pages Router, Next imports, Server Components). Your current apps are Single Page Applications (SPAs) using `react-router-dom` and client-side `react-query`. 

Because of this, you are effectively doing a **full migration from React SPA to Next.js App Router**, which is a substantial effort but yields the server-side fetching and Cloudflare deployment benefits you desire.

## 🛠️ Key Migration Steps

### 1. Framework & Dependency Updates
- **Remove**: `react-router-dom`, standard `@vitejs/plugin-react` (if Vinext provides its own).
- **Add**: `vinext` dependencies, Cloudflare adapter for Vinext.
- **Update**: `package.json` scripts (`dev`, `build`, `start`) to use Vinext commands.

### 2. Routing Rewrite (The biggest chunk of work)
- **Current**: Centralized routing via `react-router-dom` in `App.tsx` / `main.tsx`.
- **Target**: File-system based routing using the Next.js App Router paradigm (`app/` directory).
- **Action**: Move all components from `src/pages/` into the `app/` directory structure (e.g., `app/dashboard/page.tsx`).

### 3. Server-Side Fetching & Security (Your main goal)
- **Current**: Client-side data fetching with `@tanstack/react-query`. API keys or tokens might be exposed to the client.
- **Target**: React Server Components (RSC) and Server Actions.
- **Action**: 
  - Move data fetching for initial loads to Server Components.
  - Keep React Query only for highly interactive client-side state, or replace it entirely with Server Actions for mutations.
  - Secure sensitive API calls by ensuring they only run on the server.

### 4. Authentication & State Adaptation
- **State**: Mark interactive components (using `zustand`, `useState`, etc.) with the `"use client"` directive.
- **Auth**: If authentication currently relies on `localStorage`, it must be refactored to use **Cookies**, as Server Components cannot read `localStorage` during SSR.

### 5. Cloudflare Integration
- Configure Vinext to output for Cloudflare Workers.
- Update CI/CD pipelines to deploy to Cloudflare.

## 💡 Recommendation
Since `public-web` is already using Next.js (`next: ^16.1.1` in its `package.json`), you already have the Next.js knowledge in the repo. 
1. Start with the smallest app (e.g., `kitchen-panel` or `waiter-panel`).
2. Port its routing to the Vinext App Router.
3. Establish the SSR Auth & Fetching patterns.
4. Roll out to the larger `admin-panel`.
