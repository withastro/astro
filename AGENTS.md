# Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

# Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

# Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

# Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

# Style Guide

- Not defined here. For now, follow the same conventions and patterns that you detect in the surrounding code.
- Keep formatting consistent. Our rules are defined in our [biome.jsonc](./biome.jsonc) file, enforced by Biome.
- Run `pnpm format` to auto-format the entire repo.
- Run `pnpm lint` to lint the entire repo.

# Environment Guide

- Use `node -e` for scripting tasks, not `python` or `python3`.

# Monorepo Structure

This directory is a Git monorepo containing a `pnpm` workspace:

- The codebase is primarily TypeScript.
- All packages live in `packages/`.
- Integration packages live in `packages/integrations/`.
- The core Astro package is `packages/astro`.

In error stack traces, built files from workspace packages in `node_modules/` map to TypeScript source in `packages/`:

- `node_modules/astro/dist/...` → `packages/astro/src/...`
- `node_modules/@astrojs/react/...` → `packages/integrations/react/src/...`

Edits to source files take effect after rebuilding the package via `pnpm build`.

Use `pnpm -C <dir> <command>` for project-local script commands when working in packages/examples/triage directories (Example: `pnpm -C packages/astro build`, `pnpm -C examples/blog dev`). Only omit `-C` flag when intentionally working in the monorepo root (Example: `pnpm format`, `pnpm lint`, `pnpm test:types`).

# Running Tests

- Run `pnpm test` in workspace root or package directory to run full test suite (can be slow!)
- Integration tests live in special `packages/integrations` folders.
- Example: `pnpm -C <package-directory> exec astro-scripts test` - Run a single package test suite
- Example: `pnpm -C <package-directory> exec astro-scripts test "test/actions.test.js"` - Run a single test file
- Example: `pnpm -C <package-directory> exec astro-scripts test "test/**/*.test.js" --match "CSS"` - Run specific tests matching a string or regex patterns
- Example: `pnpm -C <package-directory> exec astro-scripts test "test/{actions,css,middleware}.test.js"` - Run multiple test files
- Key flags:
  - `--match` / `-m`: Filter tests by name pattern (regex)
  - `--only` / `-o`: Run only tests marked with `.only`
  - `--parallel` / `-p`: Run tests in parallel (default is sequential)
  - `--timeout` / `-t`: Set timeout in milliseconds
  - `--watch` / `-w`: Watch mode

# Astro Quick Reference

- Use `astro dev` to start the local dev server with HMR. Do not use other web servers (`python -m http.server`, etc.).
- Use `astro build` to create a production build in `dist/`, by default.
- Use `astro preview` to serve the production build locally. Do not use other web servers (`python -m http.server`, etc.).
- Use `astro check` to run type checking and diagnostics.
- Use `astro sync` to generate and update TypeScript types.
- Use `astro add` to install and configure an official integration.
- Fetch **LLM-optimized** docs at https://docs.astro.build/llms.txt.
- Fetch **Full docs** at https://docs.astro.build/ (primary source, use when llms.txt lacks info).

# `bgproc`

Use `pnpm exec bgproc` to start, stop, and manage long-running `astro dev` & `astro preview` servers in the background. Do not manually start detatched servers with `&` if you can use `bgproc` instead.

Use `pnpm exec bgproc --help` to see all available commands.

Workflow:

1. `pnpm exec bgproc start -n devserver --wait-for-port 10 --force -- pnpm -C examples/minimal dev` - Start the dev server
2. `pnpm exec bgproc logs -n devserver` - View logs from the dev server. Useful for debugging server logs.
3. `pnpm exec bgproc stop -n devserver` - Stop the dev server when your work is complete
4. `pnpm exec bgproc list` - List all running servers, background processes. Useful for cleanup.

# `agent-browser`

Use `agent-browser` for web automation or when UI interaction, long-running browsers, or HMR testing is required. Do not use `curl` to test HMR issues.

Use `agent-browser --help` to see all available commands.

Workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after all page changes, navigations, interactions.

Note: `agent-browser` should be installed globally, and is not a dependency of this monorepo. If `agent-browser` isn't available on this machine, ask the user to run `npm install -g agent-browser && agent-browser install`. If you are running in headless mode with no human operator and need this tool to complete your job, it is best to fail the job vs. trying to work around not having the tool.

# Deep Dives

Detailed reference documents on specific subsystems. Read the relevant section before diving into a bug or feature in that area.

## Unit Testing

When writing unit tests, read [`reference/unit-testing.md`](./reference/unit-testing.md) for conventions, file placement, and the shared test utilities and mocks available in the repo. Do not duplicate existing helpers.

## Vite Dep Optimizer (`optimizeDeps`)

When a bug works in `astro build` but fails in `astro dev` with errors like `require is not defined`, the root cause is almost always Vite's dep optimizer failing to pre-bundle a CJS dependency. `astro build` uses Rollup and handles CJS→ESM reliably; `astro dev` relies on esbuild's optimizer scan, which is intentionally shallow and will miss deps that are only reachable through non-JS files (like `.astro` components in `node_modules`). The key files are `packages/astro/src/vite-plugin-environment/index.ts` (sets `optimizeDeps.entries`) and `packages/astro/src/core/create-vite.ts` (wires up `vitefu`/`crawlFrameworkPkgs`). For a full deep-dive including a debugging playbook and potential fixes, see [`reference/optimize-deps.md`](./reference/optimize-deps.md).
