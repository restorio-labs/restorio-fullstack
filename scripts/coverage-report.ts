import fs from "node:fs";
import path from "node:path";

type Row = {
  name: string;
  lines: number;
  statements: number;
  functions: number;
  branches: number;
};

function color(pct: number) {
  if (pct >= 80) return "🟢";
  if (pct >= 60) return "🟡";
  return "🔴";
}

function collect(baseDir: string, ignore: string[] = []): Row[] {
  if (!fs.existsSync(baseDir)) return [];

  const rows: Row[] = [];

  for (const name of fs.readdirSync(baseDir)) {
    if (ignore.includes(name)) continue;

    const summaryPath = path.join(
      baseDir,
      name,
      "coverage",
      "coverage-summary.json"
    );

    if (!fs.existsSync(summaryPath)) continue;

    const json = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    const t = json.total;

    rows.push({
      name,
      lines: t.lines.pct,
      statements: t.statements.pct,
      functions: t.functions.pct,
      branches: t.branches.pct,
    });
  }

  return rows;
}

function table(title: string, rows: Row[]) {
  if (rows.length === 0) {
    return `### ${title}\n_No coverage data_\n`;
  }

  return `
### ${title}

| Name | Lines | Statements | Functions | Branches |
|------|-------|------------|-----------|----------|
${rows
  .map(
    r =>
      `| ${r.name} | ${color(r.lines)} ${r.lines}% | ${color(
        r.statements
      )} ${r.statements}% | ${color(r.functions)} ${
        r.functions
      }% | ${color(r.branches)} ${r.branches}% |`
  )
  .join("\n")}
`;
}

// 🔹 collect coverage
const appRows = collect("apps", ["api"]); // exclude Python API
const packageRows = collect("packages");

// 🔹 write markdown
const markdown = `
## 🧪 Unit Test Coverage

${table("Apps", appRows)}

${table("Packages", packageRows)}
`;

fs.writeFileSync("coverage-summary.md", markdown.trim() + "\n");
