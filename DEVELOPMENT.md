# Restorio Platform - Development Guide

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
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
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

4. Start the development environment:
```bash
docker compose up -d
```

5. Access the services:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Admin Panel: http://localhost:3001
- Kitchen Panel: http://localhost:3002
- Tablet App: http://localhost:3003
- Public Web: http://localhost:3000

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
npm install

# Run all apps in dev mode
npm run dev

# Build all apps
npm run build

# Lint all apps
npm run lint

# Format all files
npm run format

# Clean all build artifacts
npm run clean
```

### Individual Apps

#### Public Web (Next.js)
```bash
cd apps/public-web
npm run dev     # Start dev server on port 3000
npm run build   # Build for production
npm run start   # Start production server
```

#### Admin Panel (React + Vite)
```bash
cd apps/admin-panel
npm run dev     # Start dev server on port 3001
npm run build   # Build for production
npm run preview # Preview production build
```

#### Kitchen Panel (React + Vite)
```bash
cd apps/kitchen-panel
npm run dev     # Start dev server on port 3002
npm run build   # Build for production
```

#### Tablet App (React + Vite)
```bash
cd apps/tablet-app
npm run dev     # Start dev server on port 3003
npm run build   # Build for production
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
import { User, Order, UserRole } from '@restorio/types';
```

### UI Package (`@restorio/ui`)
```typescript
// Import in React apps
import { Button, Card, Input } from '@restorio/ui';
```

### API Client (`@restorio/api-client`)
```typescript
import { ApiClient, RestorioApi } from '@restorio/api-client';

const client = new ApiClient({
  baseURL: 'http://localhost:8000',
  getAccessToken: () => localStorage.getItem('token'),
});

const api = new RestorioApi(client);
```

### Auth Helpers (`@restorio/auth`)
```typescript
import { TokenStorage, hasPermission, Permissions } from '@restorio/auth';

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

### Backend Tests
```bash
cd apps/api
pytest
```

### Frontend Tests
```bash
cd apps/admin-panel
npm test
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
npm run clean
rm -rf node_modules
npm install
```

### TypeScript errors
```bash
# Rebuild TypeScript projects
npm run build
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

