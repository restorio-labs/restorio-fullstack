# Restorio Platform - Development Guide

## Quick Start

### Prerequisites

- [Python](https://www.python.org/downloads/release/python-31212/) 3.12.x
- [Bun](https://bun.sh) 1.3.5+ (fast JavaScript runtime)
- Docker and Docker Compose
- Git

### Initial Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd restorio-fullstack
```

2. Install dependencies:

```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Install all dependencies
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

4. Start the development environment:

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string

# Start all services
docker compose up -d

# Verify services are running
docker compose ps
```

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md).

5. Start frontend apps:

```bash
# Install dependencies (first time)
bun install

# Start all frontend apps
bun run dev
```

6. Access the services:

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Public Web: http://localhost:3000 (Next.js)
- Admin Panel: http://localhost:3001 (React)
- Kitchen Panel: http://localhost:3002 (React)
- Tablet App: http://localhost:3003 (React)

For detailed startup instructions, see [START.md](./START.md).

## Project Structure

```
restorio-fullstack/
├── apps/
│   ├── public-web/        # Next.js public restaurant pages
│   ├── admin-panel/       # React admin dashboard (Vite)
│   ├── kitchen-panel/     # React kitchen UI (Vite)
│   ├── tablet-app/        # React PWA / kiosk (Vite)
│   └── api/               # FastAPI backend
├── packages/
│   ├── ui/                # Shared UI components
│   ├── types/             # Shared TypeScript types
│   ├── api-client/        # Typed API client
│   └── auth/              # Auth & RBAC helpers
├── nginx/                 # NGINX configuration
├── docker-compose.yml     # Docker services
└── turbo.json            # Turborepo configuration
```

## Development Commands

### Root Level (Monorepo)

```bash
# Install all dependencies
bun install

# Run all apps in dev mode
bun run dev

# Build all apps
bun run build

# Lint all apps
bun run lint

# Format all files
bun run format

# Clean all build artifacts
bun run clean
```

### Individual Apps

#### Public Web (Next.js)

```bash
cd apps/public-web
bun run dev     # Start dev server on port 3000
bun run build   # Build for production
bun run start   # Start production server
```

#### Admin Panel (React + Vite)

```bash
cd apps/admin-panel
bun run dev     # Start dev server on port 3001
bun run build   # Build for production
bun run preview # Preview production build
```

#### Kitchen Panel (React + Vite)

```bash
cd apps/kitchen-panel
bun run dev     # Start dev server on port 3002
bun run build   # Build for production
```

#### Tablet App (React + Vite)

```bash
cd apps/tablet-app
bun run dev     # Start dev server on port 3003
bun run build   # Build for production
```

#### API (FastAPI)

```bash
cd apps/api
# Using Docker (recommended)
docker compose up api

# Or locally with Python
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Docker Services

### Start all services

```bash
docker compose up -d
```

### View logs

```bash
docker compose logs -f
docker compose logs -f api    # API logs only
docker compose logs -f redis  # Redis logs only
```

### Stop all services

```bash
docker compose down
```

### Rebuild services

```bash
docker compose up -d --build
```

### Reset data

```bash
docker compose down -v  # Remove volumes
```

## Working with Shared Packages

The monorepo uses Turborepo and npm workspaces for package management. Changes to shared packages are automatically reflected in apps during development.

### Types Package (`@restorio/types`)

```typescript
// Import in any app
import { User, Order, UserRole } from "@restorio/types";
```

### UI Package (`@restorio/ui`)

```typescript
// Import in React apps
import { Button, Card, Input } from "@restorio/ui";
```

### API Client (`@restorio/api-client`)

```typescript
import { ApiClient, RestorioApi } from "@restorio/api-client";

const client = new ApiClient({
  baseURL: "http://localhost:8000",
  getAccessToken: () => localStorage.getItem("token"),
});

const api = new RestorioApi(client);
```

### Auth Helpers (`@restorio/auth`)

```typescript
import { TokenStorage, hasPermission, Permissions } from "@restorio/auth";

TokenStorage.setTokens(accessToken, refreshToken);
const canManageMenus = hasPermission(userRole, Permissions.MANAGE_MENUS);
```

## Environment Variables

### Required Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=mongodb+atlas://...

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Payment Providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PRZELEWY24_MERCHANT_ID=...
PRZELEWY24_POS_ID=...
PRZELEWY24_CRC=...
PRZELEWY24_API_KEY=...
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Add your IP address to the whitelist (or allow all: 0.0.0.0/0 for development)
4. Create a database user
5. Get the connection string and add it to `.env`

### Local MongoDB (Alternative)

Add MongoDB to `docker-compose.yml`:

```yaml
mongodb:
  image: mongo:7
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: password
  volumes:
    - mongodb-data:/data/db
```

## Testing

### Unit Tests (Vitest)

Unit tests are located in `tests-unit/` folders within each package and app.

```bash
# Run all unit tests
bun run test:unit

# Run tests in watch mode
bun run test:unit --watch

# Run tests for a specific package
cd packages/auth
bun run test

# Run tests with coverage
bun run test:unit --coverage
```

**Test Structure:**

- `packages/*/tests-unit/` - Shared package tests
- `apps/*/tests-unit/` - Application-specific tests

### E2E Tests (Playwright)

End-to-end tests are in the `e2e/` folder.

```bash
# Install Playwright browsers (first time)
cd e2e
bunx playwright install

# Run all E2E tests
bun run test:e2e

# Run tests in UI mode (interactive)
bun run test:e2e:ui

# Run tests in headed mode (see browser)
cd e2e
bun run test:headed

# Debug tests
cd e2e
bun run test:debug
```

**E2E Test Structure:**

- `e2e/tests/` - Test files
- `e2e/fixtures/` - Test helpers and fixtures

### Backend Tests (Python)

```bash
cd apps/api
pytest
```

### Writing Tests

**Unit Test Example:**

```typescript
import { describe, it, expect } from "vitest";
import { hasPermission, Permissions, UserRole } from "@restorio/auth";

describe("Permissions", () => {
  it("should allow owner to manage menus", () => {
    expect(hasPermission(UserRole.OWNER, Permissions.MANAGE_MENUS)).toBe(true);
  });
});
```

**E2E Test Example:**

```typescript
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "user@example.com");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
});
```

## Troubleshooting

### Port already in use

```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9  # For API
lsof -ti:3000 | xargs kill -9  # For Next.js
```

### Docker issues

```bash
# Reset Docker environment
docker compose down -v
docker system prune -a
docker compose up -d --build
```

### Module resolution errors

```bash
# Clear all node_modules and reinstall
bun run clean
rm -rf node_modules bun.lockb
bun install
```

### TypeScript errors

```bash
# Rebuild TypeScript projects
bun run build
```

## Git Workflow

1. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make changes and commit:

```bash
git add .
git commit -m "feat: add feature description"
```

3. Push and create PR:

```bash
git push origin feature/your-feature-name
```

## Code Style

- Use Prettier for formatting (`.prettierrc`)
- Follow TypeScript strict mode
- Use ESLint for linting
- Format before committing: `npm run format`

## Architecture Decisions

### Why Monorepo?

- Code sharing between apps
- Consistent tooling and dependencies
- Atomic changes across packages
- Better developer experience

### Why Hybrid Frontend?

- Next.js for SEO-critical public pages
- React + Vite for interactive dashboards (faster dev experience)
- Shared UI components via `@restorio/ui`

### Why FastAPI?

- High performance async Python
- Automatic API documentation
- Type hints and validation
- Easy to deploy and scale

### Why MongoDB?

- Schema flexibility for multi-tenant data
- Easy to scale horizontally
- Free tier for development and testing
- JSON-like documents match TypeScript types

## Next Steps

1. Set up authentication module (Ticket 0.3)
2. Implement tenant resolution (Ticket 0.4)
3. Create restaurant management endpoints (Ticket 1.1)
4. Build menu management UI (Ticket 1.2)
5. Implement ordering flow (Ticket 1.3)

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Docker Documentation](https://docs.docker.com/)

## Support

For issues, questions, or contributions, please refer to the project README or contact the development team.
