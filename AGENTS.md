# AGENTS instructions

These are common instructions for AI coding agents working in my repositories.

## General guidelines

- Never use the em dash "—" character. Use a plain dash instead "-"

- When writing comment do not add dot at the end "." 

- Do not add yourself, the agent name, or any AI tool as a co-author in commit messages.

- Do not manually edit `CHANGELOG.md`, generated files, lockfiles, or build artifacts unless the task explicitly requires it.

- When writing or substantially editing long Markdown files, put each full sentence on its own physical line.
  Preserve normal Markdown structure, but avoid wrapping multiple sentences onto one line.

- When making technical decisions, do not optimize primarily for development cost.
  Prefer quality, simplicity, robustness, scalability, security, and long-term maintainability.

- Be direct and critical in code review.
  Prioritize runtime bugs, security issues, race conditions, flaky tests, bad abstractions, and maintainability problems over cosmetic style comments.

- Before changing code, inspect the existing structure and follow the local conventions.
  Do not introduce a new pattern, dependency, framework, or folder structure unless it clearly improves the codebase.

- Prefer small, cohesive files and components.
  Split large files when it improves readability, but do not create pointless wrapper components just to move code around.

- Do not hide complexity behind vague abstractions.
  Use clear names, explicit data flow, and simple interfaces.

## Bug fixing

- When fixing a bug, first try to reproduce the issue.
  Prefer reproducing it through the same path an end user would use.

- For UI bugs, start with the actual screen or interaction before touching implementation details.

- Fix the real cause, not just the symptom.
  If a change only masks the issue, explain why and propose the proper fix.

- After fixing a bug, add or update tests when practical.
  Prefer regression tests that would have failed before the fix.

## Frontend guidelines

- Prefer TypeScript-first code.
  Avoid `any` unless there is a clear reason.

- Keep React and Next.js components readable.
  Extract hooks, utilities, constants, and child components when a file becomes hard to scan.

- For client components, keep `"use client"` as narrow as possible.
  Do not turn large trees into client components unless necessary.

- Do not over-engineer styling.
  Use the existing Tailwind, CSS, or component conventions already present in the project.

- Be picky about UI quality.
  If something clearly looks broken, misaligned, inconsistent, or awkward, mention it and fix it when it is close to the current task.

## Backend guidelines

- Prefer clear module boundaries.
  For Python/FastAPI projects, keep routes, services, schemas, repositories, and domain logic separated.

- For Go and Rust projects, prefer simple, explicit code over clever abstractions.

- Handle errors deliberately.
  Do not swallow errors silently and do not return vague error messages when a better one is available.

- Validate inputs at boundaries.
  Keep business logic independent from transport details where practical.

- Be careful with concurrency, async code, background workers, and queues.
  Treat deadlocks, race conditions, retries, idempotency, and cancellation as serious concerns.

## Testing and quality

- Run the smallest relevant check first, then broader checks when the change is stable.

- Fix lint, typecheck, test failures, and flaky tests.
  Do not ignore a failure just because it is not directly caused by the current change.

- Prefer meaningful tests over snapshot noise.
  Tests should prove behavior, not implementation details.

- For E2E tests, stay aligned with real user behavior.
  Avoid testing fake flows that do not match how the app is actually used.

- When changing imports, file paths, or shared types, run the relevant typecheck or build command.

## Git and commits

- Keep commits focused.
  Do not mix unrelated refactors, formatting, and feature work in one change unless requested.

- Commit messages should be concise and human-written.
  Never add AI attribution or co-author metadata.

- Before committing, show the changed files and summarize the risk areas.

- Do not rewrite history, force push, delete branches, or remove files unless explicitly asked.

## Project commands

- Prefer the package manager already used by the repository.
  Check for `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `uv.lock`, `poetry.lock`, `go.mod`, or `Cargo.toml` before running commands.

- Do not install new dependencies without explaining why they are needed.

- For JavaScript and TypeScript projects, look for scripts in `package.json` before inventing commands.

- For Docker projects, inspect `docker-compose.yml`, `docker-compose.prod.yml`, Makefiles, and README instructions before running containers.

- For GitHub Actions or deployment workflows, be extra careful with secrets, production paths, environment names, and destructive commands.

## Security and data

- Never print secrets, tokens, private keys, cookies, or production credentials.

- Do not weaken authentication, authorization, CORS, origin checks, rate limits, or input validation to make a test pass.

- Avoid logging sensitive user data, raw private messages, payment details, or full request bodies unless explicitly safe.

- When working with AI or LLM features, consider prompt injection, data leakage, unsafe tool calls, and untrusted user input.

## Documentation

- Update documentation only when it helps future work.
  Do not add generic docs just for the sake of documenting.

- Keep docs practical.
  Prefer exact commands, paths, examples, and tradeoffs.

- If a project has architecture decisions, tickets, or diagrams, keep them consistent with the code.

## Preferences

- Be practical, but do not be sloppy.

- Prefer concrete file paths, exact code changes, and clear next steps.

- When reviewing code, be as critical as necessary.

- When proposing architecture, prefer modular monoliths and simple deployable systems unless the project clearly needs something else.

- Prefer automation when it removes repetitive work, but keep automation tasks separate and easy to reason about.

- Avoid unnecessary ceremony.
  Do not create a huge abstraction just to wrap a tiny component or function.

## Optional personal context files

- If `~/OPINIONS.md` exists and the task would benefit from my technical opinions, read it before making architectural decisions.

- If `~/VOICE.md` exists and you are writing on my behalf, read it before drafting public text, emails, posts, or comments.


## GitHub project management

Use the GitHub MCP server for issues, labels, pull requests, GitHub Projects,
Project fields, Project items, iterations and Actions.

When creating an epic:
1. Create the parent issue.
2. Create its child issues.
3. Connect them using sub-issues.
4. Add all issues to the appropriate GitHub Project.
5. Set Status, Priority, Size and Sprint fields when available.
6. Link related issues explicitly in their descriptions.

For creating, updating, closing or deleting repository milestones, use
`gh api`, because the GitHub MCP server currently only supports assigning an
existing milestone number to an issue.