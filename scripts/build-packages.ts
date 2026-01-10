import { $ } from "bun";

const packages = ["types", "auth", "api-client", "ui"] as const;

console.log("🔨 Building packages...\n");

try {
  console.log("📦 Building @restorio/types (must be built first)...");
  const typesResult = await $`cd packages/types && bun run build`;
  if (typesResult.exitCode !== 0) {
    console.error("❌ Failed to build @restorio/types");
    console.error("stdout:", typesResult.stdout.toString());
    console.error("stderr:", typesResult.stderr.toString());
    process.exit(1);
  }
  console.log("✅ @restorio/types built successfully\n");

  const otherPackages = packages.filter((pkg) => pkg !== "types");

  console.log(`📦 Building other packages: ${otherPackages.join(", ")}...\n`);

  const buildPromises = otherPackages.map(async (pkg) => {
    try {
      const result = await $`cd packages/${pkg} && bun run build`;
      if (result.exitCode !== 0) {
        console.error(`\n❌ Failed to build @restorio/${pkg}`);
        console.error("stdout:", result.stdout.toString());
        console.error("stderr:", result.stderr.toString());
        return false;
      }
      console.log(`✅ @restorio/${pkg} built successfully`);
      return true;
    } catch (error) {
      console.error(`\n❌ Error building @restorio/${pkg}:`, error);
      return false;
    }
  });

  const results = await Promise.all(buildPromises);

  if (results.every((r) => r)) {
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
    console.error("\n❌ Some packages failed to build");
    process.exit(1);
  }
} catch (error) {
  console.error("\n❌ Fatal error during package build:", error);
  process.exit(1);
}
