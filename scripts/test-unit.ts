import { $ } from "bun";

const isCI = !!process.env.GITHUB_ACTIONS;

const changedApps = process.env.CHANGED_APPS?.split(",").filter(Boolean) || [];
const changedPackages = process.env.CHANGED_PACKAGES?.split(",").filter(Boolean) || [];

console.log("🧪 Running unit tests...\n");

if (isCI) {
  console.log("🔍 CI mode: Generating coverage reports for PR comments");
  console.log("📊 Using root vitest.config.ts");
  if (changedApps.length > 0 || changedPackages.length > 0) {
    console.log(`📦 Testing changed items: ${[...changedPackages, ...changedApps].join(", ")}\n`);
  } else {
    console.log("📦 Testing all apps and packages\n");
  }
} else {
  console.log("💻 Local mode: Displaying coverage table");
  console.log("📊 Using root vitest.config.ts\n");
}

const testPatterns: string[] = [];

if (changedPackages.length > 0) {
  changedPackages.forEach((pkg) => {
    testPatterns.push(`app/packages/${pkg}/tests/unit/**/*.{test,spec}.{ts,tsx}`);
  });
}

if (changedApps.length > 0) {
  changedApps.forEach((app) => {
    testPatterns.push(`app/apps/${app}/tests/unit/**/*.{test,spec}.{ts,tsx}`);
  });
}

let result;
if (testPatterns.length > 0) {
  result = await $`vitest run --coverage --config vitest.config.ts ${testPatterns}`;
} else {
  result = await $`vitest run --coverage --config vitest.config.ts`;
}

if (result.exitCode !== 0) {
  console.error("\n❌ Unit tests failed");
  process.exit(1);
}

if (isCI) {
  console.log("\n✅ Tests passed! Coverage reports generated in ./coverage");
  console.log("📊 Coverage data ready for PR comments");
  console.log("   - coverage/coverage-summary.json");
} else {
  console.log("\n✅ All tests passed!");
  console.log("📊 Coverage table displayed above");
  console.log("📁 HTML report available in ./coverage");
}

process.exit(0);
