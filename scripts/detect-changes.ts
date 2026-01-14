/// <reference types="bun" />
import { $ } from "bun";

const isCI = !!process.env.GITHUB_ACTIONS;

const apps = ["admin-panel", "kitchen-panel", "mobile-app", "ui-demo", "public-web"] as const;
const packages = ["types", "auth", "api-client", "ui"] as const;

type App = (typeof apps)[number];
type Package = (typeof packages)[number];

interface ChangedItems {
  apps: App[];
  packages: Package[];
}

async function detectChangedAppsAndPackages(): Promise<ChangedItems> {
  const changedApps: App[] = [];
  const changedPackages: Package[] = [];

  if (!isCI) {
    console.log("💻 Local mode: Building and testing all apps and packages");
    return {
      apps: [...apps],
      packages: [...packages],
    };
  }

  const baseRef = process.env.GITHUB_BASE_REF || "main";
  const headRef = process.env.GITHUB_HEAD_REF || "HEAD";

  try {
    const changedFiles = await $`git diff --name-only origin/${baseRef}...${headRef}`.text();
    const files = changedFiles.trim().split("\n").filter(Boolean);

    if (files.length === 0) {
      console.log("📝 No changed files detected, building and testing all apps and packages");
      return {
        apps: [...apps],
        packages: [...packages],
      };
    }

    console.log(`🔍 Detecting changes from ${baseRef} to ${headRef}...`);
    console.log(`📝 Found ${files.length} changed file(s)\n`);

    for (const app of apps) {
      if (files.some((file) => file.startsWith(`app/apps/${app}/`))) {
        changedApps.push(app);
        console.log(`  ✅ ${app} - changed`);
      }
    }

    for (const pkg of packages) {
      if (files.some((file) => file.startsWith(`app/packages/${pkg}/`))) {
        changedPackages.push(pkg);
        console.log(`  ✅ ${pkg} - changed`);
      }
    }

    if (files.some((file) => file.startsWith("app/packages/") || file.startsWith("app/apps/"))) {
      const rootFiles = files.filter(
        (file) =>
          !file.startsWith("app/packages/") &&
          !file.startsWith("app/apps/") &&
          (file.includes("package.json") ||
            file.includes("tsconfig") ||
            file.includes("vitest.config") ||
            file.includes("turbo.json") ||
            file.includes("scripts/")),
      );

      if (rootFiles.length > 0) {
        console.log("\n⚠️  Root-level changes detected, building and testing all apps and packages");
        console.log(`   Changed files: ${rootFiles.join(", ")}`);
        return {
          apps: [...apps],
          packages: [...packages],
        };
      }
    }

    if (changedApps.length === 0 && changedPackages.length === 0) {
      console.log("📝 No app or package changes detected");
      return {
        apps: [],
        packages: [],
      };
    }

    console.log(`\n📦 Summary: ${changedPackages.length} package(s), ${changedApps.length} app(s) changed\n`);

    return {
      apps: changedApps,
      packages: changedPackages,
    };
  } catch (error) {
    console.error("⚠️  Error detecting changes, building and testing all apps and packages");
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    return {
      apps: [...apps],
      packages: [...packages],
    };
  }
}

const result = await detectChangedAppsAndPackages();

console.log(JSON.stringify(result));
