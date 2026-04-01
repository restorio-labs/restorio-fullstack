# Production Routing & API Gateway Architecture

This plan outlines the production-ready Nginx configuration to route subdomain traffic (e.g., `api.restorio.org`, `admin.restorio.org`) to specific containerized services behind an external SSL-terminating Load Balancer.

## 1. Architecture Topology

- **External Load Balancer / CDN (e.g., Cloudflare):** Terminates HTTPS (SSL) and forwards plain HTTP traffic to the host machine.
- **Nginx (Port 80):** Acts as the unified internal router. It inspects the `Host` header and proxies traffic to the correct internal Docker container.
- **Dockerized Services:** `api`, `public-web`, `admin-panel`, `waiter-panel`, `mobile-app` and `kitchen-panel` run in the Docker network, exposing no public ports.

## 2. Nginx Subdomain Configuration

We will replace the single `location /` block with dedicated `server` blocks based on the `server_name`:

- `server_name api.restorio.org;` -> proxies to `http://api:8000;`
- `server_name restorio.org www.restorio.org;` -> proxies to `http://public-web:3000;`
- `server_name admin.restorio.org;` -> proxies to `http://admin-panel:3000;`
- `server_name kitchen.restorio.org;` -> proxies to `http://kitchen-panel:3000;`
- `server_name waiter.restorio.org;` -> proxies to `http://waiter-panel:3000;`
- `server_name mobile.restorio.org;` -> proxies to `http://mobile-app:3000;`

*Note: Nginx will rely on the `X-Forwarded-Proto: https` header sent by the external LB to ensure redirects and cookies (like secure cookies) function correctly.*

## 3. Docker Compose Updates

To support this in production, the `docker-compose.yml` needs the frontend services defined as containers so Nginx can route to them.

- Add `public-web`, `admin-panel`, `waiter-panel`, `mobile-app` and `kitchen-panel` as Docker services.
- Ensure all services are attached to the `restorio-network`.

## 4. Security & Environment Alignment

- **Strict-Transport-Security (HSTS):** Since HTTPS is handled externally, we will uncomment and configure the HSTS header in Nginx to instruct browsers to always use HTTPS.
- **CORS & Environment Variables:** Update the backend's `CORS_ORIGINS` to allow the production subdomains. Ensure frontend build steps utilize the absolute production URLs (e.g., `NEXT_PUBLIC_API_URL=https://api.restorio.org/api/v1`).

### Fixed ✅: HSTS Header Enabled

HSTS header (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) is now enabled on all production server blocks in `nginx/nginx.conf`.

### Fixed ✅: Subdomain Routing Configuration

Nginx now has dedicated `server` blocks for each subdomain:

- `api.restorio.org` → `http://api:8000`
- `restorio.org` / `www.restorio.org` → `http://public-web:3000`
- `admin.restorio.org` → `http://admin-panel:3000`
- `kitchen.restorio.org` → `http://kitchen-panel:3000`
- `waiter.restorio.org` → `http://waiter-panel:3000`
- `mobile.restorio.org` → `http://mobile-app:3000`

### Fixed ✅: CORS Origins Explicit Allowlist

Replaced wildcard `https://*.restorio.org` with explicit subdomain list in `app/api/core/foundation/infra/config.py` for tighter security control.

### Fixed ✅: X-Forwarded-Proto Handling

Added `map` directive to properly detect HTTPS from external load balancer's `X-Forwarded-Proto` header, ensuring secure cookies and redirects work correctly.

## 5. Local Development Parity

To mirror this exact setup locally without HTTPS:

- Map the local domains in your `/etc/hosts` file (e.g., `127.0.0.1 api.local admin.local kitchen.local restorio.local`).
- Use a `.env.development` or Nginx templating to swap `restorio.org` for `.local` during local runtime, or simply add both to the `server_name` directive (e.g., `server_name api.restorio.org api.local;`).
