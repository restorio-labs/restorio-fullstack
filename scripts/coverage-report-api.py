#!/usr/bin/env python3
import json
import os
from pathlib import Path
from typing import Any

COVERAGE_DIR = os.getenv("COVERAGE_DIR", "coverage")
COVERAGE_PATH = Path(COVERAGE_DIR) / "coverage.json"


def color(pct: float) -> str:
    if pct >= 80:
        return "🟢"
    if pct >= 60:
        return "🟡"
    return "🔴"


def round_pct(pct: float) -> float:
    return round(pct * 100) / 100


def read_coverage() -> dict[str, Any]:
    if not COVERAGE_PATH.exists():
        raise FileNotFoundError(f"Coverage file not found: {COVERAGE_PATH}")

    print(f"📄 Using coverage file: {COVERAGE_PATH}")

    with open(COVERAGE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_module_name(file_path: str) -> str | None:
    normalized_path = file_path.replace("\\", "/")

    if "apps/api/" in normalized_path:
        parts = normalized_path.split("apps/api/")[1].split("/")
    elif normalized_path.startswith("/"):
        parts = normalized_path.lstrip("/").split("/")
    else:
        parts = normalized_path.split("/")

    if not parts:
        return None

    module = parts[0]
    if module in ("core", "api", "modules", "routes"):
        if len(parts) >= 2 and parts[1] != "__init__.py":
            return f"{module}/{parts[1]}"
        return module
    return None


def aggregate_by_module(
    coverage_data: dict[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    modules: dict[str, list[dict[str, Any]]] = {}

    files = coverage_data.get("files", {})

    for file_path, file_data in files.items():
        if file_path == "__init__.py" or not file_path.endswith(".py"):
            continue

        module = extract_module_name(file_path)
        if not module:
            continue

        summary = file_data.get("summary", {})
        if summary.get("num_statements", 0) == 0:
            continue

        if module not in modules:
            modules[module] = []

        modules[module].append(summary)

    return modules


def calculate_avg_metrics(summaries: list[dict[str, Any]]) -> dict[str, float]:
    if not summaries:
        return {"lines": 0.0, "statements": 0.0}

    statements_with_data = [s for s in summaries if s.get("num_statements", 0) > 0]

    lines_pct = sum(s.get("percent_covered", 0) for s in summaries) / len(summaries)
    statements_pct = (
        sum(s.get("percent_covered", 0) for s in statements_with_data)
        / len(statements_with_data)
        if statements_with_data
        else 0.0
    )

    return {
        "lines": round_pct(lines_pct),
        "statements": round_pct(statements_pct),
    }


def render_table(title: str, rows: list[dict[str, Any]]) -> str:
    if not rows:
        return ""

    table = f"\n| {title} | Lines | Statements |\n"
    table += "|------|-------|------------|\n"

    for row in rows:
        table += (
            f"| {row['name']} | {color(row['lines'])} {row['lines']}% | "
            f"{color(row['statements'])} {row['statements']}% |\n"
        )

    return table


def main() -> None:
    coverage = read_coverage()
    modules_data = aggregate_by_module(coverage)

    rows = []
    for module_name, summaries in sorted(modules_data.items()):
        metrics = calculate_avg_metrics(summaries)
        rows.append(
            {
                "name": module_name,
                "lines": metrics["lines"],
                "statements": metrics["statements"],
            }
        )

    markdown = f"## 🧪 Unit Test Coverage{render_table('API Modules', rows)}\n".strip()

    output_path = Path("coverage-summary.md")
    output_path.write_text(markdown, encoding="utf-8")

    print("✅ coverage-summary.md generated")


if __name__ == "__main__":
    main()
