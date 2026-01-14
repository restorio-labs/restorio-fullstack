/// <reference types="bun" />

import { $ } from "bun";
import { resolve } from "path";

const allPackages = ["types", "auth", "api-client", "ui"] as const;
const rootDir = process.cwd();

const filterEnv = process.env.CHANGED_PACKAGES;
const packagesToBuild = filterEnv
  ? (filterEnv.split(",").filter(Boolean) as (typeof allPackages)[number][])
  : ([...allPackages] as (typeof allPackages)[number][]);

let packages = packagesToBuild.filter((pkg) => allPackages.includes(pkg)) as (typeof allPackages)[number][];

if (packages.length === 0) {
  console.log("📦 No packages to build\n");
  process.exit(0);
}

if (!packages.includes("types") && packages.some((pkg) => pkg !== "types")) {
  packages = ["types", ...packages.filter((pkg) => pkg !== "types")] as (typeof allPackages)[number][];
}

if (filterEnv) {
  console.log(`🔨 Building changed packages: ${packages.join(", ")}...\n`);
} else {
  console.log("🔨 Building packages...\n");
}

try {
  const needsTypes = packages.includes("types");

  if (needsTypes) {
    console.log("📦 Building @restorio/types (must be built first)...");
    const typesDir = resolve(rootDir, "app/packages/types");
    const typesResult =
      await $`cd ${typesDir} && PATH="${typesDir}/node_modules/.bin:${rootDir}/node_modules/.bin:$PATH" bun run build`;
    if (typesResult.exitCode !== 0) {
      console.error("❌ Failed to build @restorio/types");
      console.error("stdout:", typesResult.stdout.toString());
      console.error("stderr:", typesResult.stderr.toString());
      process.exit(1);
    }
    console.log("✅ @restorio/types built successfully\n");

    console.log("🔗 Linking @restorio/types to dependent packages...");
    try {
      const rootLinkResult = await $`bun install`.quiet();
      if (rootLinkResult.exitCode !== 0) {
        console.error("⚠️  Warning: Failed to link at root, but continuing...");
      }
    } catch (error) {
      console.error("⚠️  Warning: Error linking at root:", error);
    }

    const dependentPackages = packages.filter((pkg) => pkg !== "types");
    if (dependentPackages.length > 0) {
      const linkPromises = dependentPackages.map(async (pkg) => {
        try {
          const pkgDir = resolve(rootDir, `app/packages/${pkg}`);
          const linkResult = await $`cd ${pkgDir} && bun install`.quiet();
          if (linkResult.exitCode !== 0) {
            console.error(`⚠️  Warning: Failed to link @restorio/types in @restorio/${pkg}`);
            return false;
          }
          return true;
        } catch (error) {
          console.error(`⚠️  Warning: Error linking @restorio/types in @restorio/${pkg}:`, error);
          return false;
        }
      });

      const linkResults = await Promise.all(linkPromises);
      if (linkResults.every((r) => r)) {
        console.log("✅ @restorio/types linked successfully\n");
      } else {
        console.log("⚠️  Some packages had linking warnings, but continuing...\n");
      }
    }
  }

  const otherPackages = packages.filter((pkg) => pkg !== "types");

  if (otherPackages.length === 0) {
    console.log("✨ All packages built successfully!");
    process.exit(0);
  }

  console.log(`📦 Building other packages: ${otherPackages.join(", ")}...\n`);

  const buildPromises = otherPackages.map(async (pkg) => {
    try {
      const pkgDir = resolve(rootDir, `app/packages/${pkg}`);
      const result =
        await $`cd ${pkgDir} && PATH="${pkgDir}/node_modules/.bin:${rootDir}/node_modules/.bin:$PATH" bun run build`;
      if (result.exitCode !== 0) {
        console.error(`\n❌ Failed to build @restorio/${pkg}`);
        console.error("stdout:", result.stdout.toString());
        console.error("stderr:", result.stderr.toString());
        return { success: false, pkg };
      }
      console.log(`✅ @restorio/${pkg} built successfully`);
      return { success: true, pkg };
    } catch (error) {
      console.error(`\n❌ Error building @restorio/${pkg}:`, error);
      return { success: false, pkg };
    }
  });

  const results = await Promise.all(buildPromises);

  const failedPackages = results.filter((r) => !r.success).map((r) => r.pkg);

  if (failedPackages.length === 0) {
    console.log("\n✨ All packages built successfully!");
    console.log("🔗 Linking packages to apps...");
    try {
      const linkResult = await $`bun install`.quiet();
      if (linkResult.exitCode !== 0) {
        console.error("⚠️  Warning: Failed to link packages at root, but builds completed");
        console.error("stdout:", linkResult.stdout.toString());
        console.error("stderr:", linkResult.stderr.toString());
      } else {
        console.log("✅ Packages linked successfully");
      }
    } catch (error) {
      console.error("⚠️  Warning: Error linking packages:", error);
    }
    process.exit(0);
  } else {
    console.error(`\n❌ Failed to build ${failedPackages.length} package(s):`);
    failedPackages.forEach((pkg) => {
      console.error(`   - @restorio/${pkg}`);
    });
    process.exit(1);
  }
} catch (error) {
  console.error("\n❌ Fatal error during package build:", error);
  process.exit(1);
}
