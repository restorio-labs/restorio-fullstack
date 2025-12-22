# E2E Tests with Playwright

End-to-end tests for the Restorio Platform using Playwright.

## Setup

```bash
# Install dependencies
bun install

# Install Playwright browsers
bunx playwright install
```

## Running Tests

```bash
# Run all tests
bun run test

# Run tests in UI mode
bun run test:ui

# Run tests in headed mode (see browser)
bun run test:headed

# Debug tests
bun run test:debug

# View test report
bun run report
```

## Test Structure

```
e2e-tests/
├── tests/           # Test files
├── fixtures/        # Test fixtures and helpers
└── playwright.config.ts
```

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Configuration

Tests are configured in `playwright.config.ts`. The config:
- Automatically starts dev servers before tests
- Runs tests in parallel
- Generates HTML reports
- Takes screenshots on failure
- Supports multiple browsers (Chrome, Firefox, Safari)

## CI/CD

In CI environments, tests will:
- Retry failed tests twice
- Run with a single worker
- Generate trace files for debugging

