import { $ } from "bun";

const isCI = !!process.env.GITHUB_ACTIONS;

console.log("🧪 Running unit tests...\n");

if (isCI) {
  console.log("🔍 CI mode: Generating coverage reports for PR comments");
  console.log("📊 Using root vitest.config.ts\n");
} else {
  console.log("💻 Local mode: Displaying coverage table");
  console.log("📊 Using root vitest.config.ts\n");
}

const result = await $`vitest run --coverage --config vitest.config.ts`;

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
