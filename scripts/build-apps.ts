/// <reference types="bun" />
import { $ } from "bun";

const allApps = ["admin-panel", "kitchen-panel", "mobile-app", "ui-demo", "public-web"] as const;

const filterEnv = process.env.CHANGED_APPS;
const appsToBuild = filterEnv
  ? (filterEnv.split(",").filter(Boolean) as (typeof allApps)[number][])
  : ([...allApps] as (typeof allApps)[number][]);

const apps = appsToBuild.filter((app) => allApps.includes(app)) as (typeof allApps)[number][];

if (apps.length === 0) {
  console.log("📱 No apps to build\n");
  process.exit(0);
}

if (filterEnv) {
  console.log(`🔨 Building changed apps: ${apps.join(", ")}...\n`);
} else {
  console.log("🔨 Building apps...\n");
}

console.log("🔗 Ensuring packages are linked in apps...");
try {
  const rootLinkResult = await $`bun install`.quiet();
  if (rootLinkResult.exitCode !== 0) {
    console.error("⚠️  Warning: Failed to link packages at root");
  }

  const appLinkPromises = apps.map(async (app) => {
    try {
      const result = await $`cd app/apps/${app} && bun install`.quiet();
      if (result.exitCode !== 0) {
        console.error(`⚠️  Warning: Failed to link packages in ${app}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`⚠️  Warning: Error linking packages in ${app}:`, error);
      return false;
    }
  });

  await Promise.all(appLinkPromises);
  console.log("✅ Packages linked in all apps");
} catch (error) {
  console.error("⚠️  Warning: Error linking packages:", error);
}

console.log(`\n📱 Building apps: ${apps.join(", ")}...\n`);

try {
  const buildPromises = apps.map(async (app) => {
    try {
      const result = await $`cd app/apps/${app} && bun run build`;
      if (result.exitCode !== 0) {
        console.error(`\n❌ Failed to build @restorio/${app}`);
        console.error("stdout:", result.stdout.toString());
        console.error("stderr:", result.stderr.toString());
        return false;
      }
      console.log(`\n✅ @restorio/${app} built successfully`);
      return true;
    } catch (error) {
      console.error(`\n❌ Error building @restorio/${app}:`, error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return false;
    }
  });

  const results = await Promise.all(buildPromises);

  const successCount = results.filter((r) => r).length;
  const failCount = results.filter((r) => !r).length;

  if (failCount === 0) {
    console.log(`\n✨ All ${successCount} apps built successfully!`);
    process.exit(0);
  } else {
    console.error(`\n❌ ${failCount} app(s) failed to build, ${successCount} succeeded`);
    process.exit(1);
  }
} catch (error) {
  console.error("\n❌ Fatal error during app build:", error);
  if (error instanceof Error) {
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  }
  process.exit(1);
}
