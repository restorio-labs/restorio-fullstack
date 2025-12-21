# Bun Setup Guide

This project uses [Bun](https://bun.sh) as the JavaScript runtime and package manager for faster performance.

## Why Bun?

- ⚡ **10-100x faster** than npm/yarn for package installation
- 🚀 **Native TypeScript/JSX support** - no transpilation needed
- 📦 **Built-in bundler** and test runner
- 🔧 **Drop-in replacement** for npm commands
- 💾 **Lower memory usage**

## Installation

### macOS/Linux

```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Verify Installation

```bash
bun --version
```

## Usage

### Install Dependencies

```bash
# Install all dependencies (workspace-aware)
bun install

# Install a new package
bun add <package-name>

# Install dev dependency
bun add -d <package-name>

# Install in specific workspace
bun add <package-name> --filter @restorio/admin-panel
```

### Run Scripts

```bash
# Run scripts from package.json
bun run dev
bun run build
bun run test

# Bun can also run TypeScript directly
bun src/index.ts
```

### Workspace Commands

```bash
# Install in all workspaces
bun install

# Run script in all workspaces (via turbo)
bun run dev

# Add dependency to specific workspace
cd apps/admin-panel
bun add react-router-dom
```

## Migration from npm

All `npm` commands work with `bun`:

| npm | bun |
|-----|-----|
| `npm install` | `bun install` |
| `npm run dev` | `bun run dev` |
| `npm add <pkg>` | `bun add <pkg>` |
| `npm test` | `bun test` |

## Configuration

Bun configuration is in `.bunfig.toml`:

```toml
[install]
workspace = true  # Enable workspace support
peer = true       # Auto-install peer dependencies
```

## Lock File

Bun uses `bun.lockb` (binary lock file) instead of `package-lock.json`. This file is:
- ✅ Faster to read/write
- ✅ Smaller in size
- ✅ More reliable
- ❌ Not human-readable (but you rarely need to read it)

The lock file is automatically generated and should be committed to git.

## Troubleshooting

### Clear Cache

```bash
bun pm cache rm
```

### Reinstall Everything

```bash
rm -rf node_modules bun.lockb
bun install
```

### Check Bun Version

```bash
bun --version
bun upgrade  # Update to latest version
```

## Performance Tips

1. **Use Bun's native features** when possible:
   - `bun test` instead of jest/vitest
   - `bun build` for bundling
   - Direct TypeScript execution

2. **Workspace support** is built-in, so no need for additional tools

3. **Hot reload** is faster with Bun's native file watching

## Next.js with Bun

Next.js works great with Bun! Just use:

```bash
bun run dev  # Instead of npm run dev
```

The Next.js dev server will use Bun's runtime automatically.

## Vite with Bun

Vite apps work seamlessly with Bun:

```bash
cd apps/admin-panel
bun run dev  # Uses Bun runtime
```

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun GitHub](https://github.com/oven-sh/bun)
- [Bun Discord](https://bun.sh/discord)

