---
name: astro-developer
description: Comprehensive guide for developing in the Astro monorepo. Covers architecture, debugging, testing, and critical constraints. Use when working on features, fixes, tests, or understanding the codebase structure.
---

# Astro Developer Skill

Context-loading skill for AI agents and developers working in the Astro monorepo. Loads relevant documentation based on your task.

## Quick Decision Matrix

**What are you doing?** → **Read these files:**

| Task                       | Primary Docs                                                         | Supporting Docs                    |
| -------------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| Adding a core feature      | [architecture.md](architecture.md), [constraints.md](constraints.md) | [testing.md](testing.md)           |
| Fixing a bug               | [debugging.md](debugging.md)                                         | [architecture.md](architecture.md) |
| Writing/fixing tests       | [testing.md](testing.md)                                             | [constraints.md](constraints.md)   |
| Creating an integration    | Explore `packages/integrations/` for examples                        | [testing.md](testing.md)           |
| Understanding architecture | [architecture.md](architecture.md)                                   | -                                  |
| Dealing with errors        | [debugging.md](debugging.md), [constraints.md](constraints.md)       | [testing.md](testing.md)           |
| Understanding constraints  | [constraints.md](constraints.md)                                     | [architecture.md](architecture.md) |

## Critical Warnings

**Before you start, be aware of these common pitfalls:**

1. **Prefer Unit Tests**: Write unit-testable code by default. Use integration tests only when necessary → [testing.md](testing.md)
2. **Node.js API Restrictions**: Cannot use Node.js APIs in `runtime/` code → [constraints.md](constraints.md)
3. **Test Isolation**: Must set unique `outDir` for each integration test → [testing.md](testing.md)
4. **Runtime Boundaries**: Core vs Vite vs Browser execution contexts → [architecture.md](architecture.md)
5. **Prerelease Mode**: Changesets target `origin/next` branch (check `.changeset/config.json`)

## Quick Command Reference

```bash
# Development
pnpm install                                    # Install (root only)
pnpm run build                                  # Build all packages
pnpm run dev                                    # Watch mode
pnpm run lint                                   # Lint codebase

# Testing
pnpm -C packages/astro exec astro-scripts test "test/**/*.test.js"  # All tests
pnpm -C packages/astro exec astro-scripts test -m "pattern"         # Filter tests
pnpm run test:e2e                               # E2E tests
node --test test/file.test.js                   # Single test

# Examples
pnpm --filter @example/minimal run dev          # Run example

# Changesets
pnpm exec changeset --empty                     # Create changeset, no interactive mode
```

## Key File Paths

```
packages/astro/src/
├── core/              # Node.js execution context (build/dev commands)
├── runtime/
│   ├── server/        # Vite SSR execution context
│   └── client/        # Browser execution context
├── virtual-modules/   # Virtual module entry points
├── content/           # Content layer system
├── vite-plugin-*/     # Vite plugins
└── types/             # Centralized TypeScript types

packages/integrations/  # Official integrations
examples/              # Test your changes here
test/fixtures/         # Test fixtures
```

**Note**: Error stack traces in `node_modules/` map to source in `packages/`. See [architecture.md](architecture.md) for details.

## Usage

This skill loads relevant context—it doesn't orchestrate workflows. After loading appropriate docs:

1. Read the recommended files for your task
2. Apply the patterns and constraints described
3. Use the commands and file paths provided
4. Search docs for error messages if you encounter issues

## Architecture Quick Summary

**Three Execution Contexts:**

- **core/** → Node.js, build/dev commands, avoid Node APIs except in Vite plugins
- **runtime/server/** → Vite SSR, CANNOT use Node APIs
- **runtime/client/** → Browser, CANNOT use Node APIs at all

**Five Pipeline Types:**

- **RunnablePipeline** → `astro dev` with Vite loader system
- **NonRunnablePipeline** → `astro dev` without runtime module loading (Cloudflare adapter)
- **BuildPipeline** → `astro build` + prerendering
- **AppPipeline** → Production serverless/SSR
- **ContainerPipeline** → Container API

See [architecture.md](architecture.md) for complete details.

## Testing Quick Summary

**Philosophy**: Prefer unit tests over integration tests. Write unit-testable code by default.

**Unit tests** (fast, preferred):

- Test pure functions and business logic
- Extract business logic from infrastructure
- Use dependency injection

**Integration tests** (slow, use sparingly):

- Only for features that cannot be unit tested (virtual modules, full build pipeline)
- Always set unique `outDir` to avoid cache pollution

See [testing.md](testing.md) for complete patterns and examples.

## When NOT to Use This Skill

- **Bug triage**: Use the `triage` skill instead
- **GitHub Actions analysis**: Use the `analyze-github-action-logs` skill
- **Simple questions**: Just ask directly, don't load this skill

## Related Documentation

- Root: [/AGENTS.md](/Users/ema/www/withastro/astro/AGENTS.md)
- Root: [/CONTRIBUTING.md](/Users/ema/www/withastro/astro/CONTRIBUTING.md)
- Astro docs: https://docs.astro.build/llms.txt
- Package: packages/astro/src/core/README.md
- Build plugins: packages/astro/src/core/build/plugins/README.md
