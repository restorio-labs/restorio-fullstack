/// <reference types="bun" />

import { $ } from "bun";
import { resolve } from "path";

const packages = ["types", "auth", "api-client", "ui"] as const;
const rootDir = process.cwd();

console.log("🔨 Building packages...\n");

try {
  console.log("📦 Building @restorio/types (must be built first)...");
  const typesDir = resolve(rootDir, "packages/types");
  const typesResult = await $`cd ${typesDir} && PATH="${typesDir}/node_modules/.bin:${rootDir}/node_modules/.bin:$PATH" bun run build`;
  if (typesResult.exitCode !== 0) {
    console.error("❌ Failed to build @restorio/types");
    console.error("stdout:", typesResult.stdout.toString());
    console.error("stderr:", typesResult.stderr.toString());
    process.exit(1);
  }
  console.log("✅ @restorio/types built successfully\n");

  console.log("🔗 Linking @restorio/types to dependent packages...");
  try {
    const linkResult = await $`bun install`.quiet();
    if (linkResult.exitCode !== 0) {
      console.error("❌ Failed to link @restorio/types");
      console.error("stdout:", linkResult.stdout.toString());
      console.error("stderr:", linkResult.stderr.toString());
      process.exit(1);
    }
    console.log("✅ @restorio/types linked successfully\n");
  } catch (error) {
    console.error("❌ Error linking @restorio/types:", error);
    process.exit(1);
  }

  const otherPackages = packages.filter((pkg) => pkg !== "types");

  console.log(`📦 Building other packages: ${otherPackages.join(", ")}...\n`);

  const buildPromises = otherPackages.map(async (pkg) => {
    try {
      const pkgDir = resolve(rootDir, `packages/${pkg}`);
      const result = await $`cd ${pkgDir} && PATH="${pkgDir}/node_modules/.bin:${rootDir}/node_modules/.bin:$PATH" bun run build`;
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
