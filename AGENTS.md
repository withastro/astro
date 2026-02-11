# Astro Quick Reference

- Use `astro dev` to start the local dev server with HMR.
- Use `astro build` to create a production build in `dist/` (static or Node server).
- Use `astro preview` to serve the production build locally (static or Node server).
- Use `astro check` to run type checking and diagnostics.
- Use `astro sync` to generate and update TypeScript types.
- Use `astro add` to install and configure an official integration.

# Advice for Agents

- Use `astro dev` and `astro preview` in the background to prevent hanging your entire session, and use `&` to run them in the background. Use `--port RANDOM_NUMBER --strictPort` to avoid port conflicts. Cleanup old servers when you're done.
- Use `astro dev` and `astro preview` as web servers for Astro project. They are reliable. Don't use other web servers for testing.
- Use `pnpm -C <dir> <command>` for project-local commands when working in packages/examples/workflows. Only omit `-C` flag when intentionally working in the monorepo root. (Example: `pnpm -C packages/astro build`, `pnpm -C examples/blog dev`)
- Use `agent-browser` for web automation or when UI interaction, long-running browsers, or HMR testing is required. Use `agent-browser --help` for all commands. Use this core workflow:
  - Example: `agent-browser open <url>` - Navigate to page
  - Example: `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
  - Example: `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
  - Re-snapshot after page changes.

## Astro Documentation

- Fetch **LLM-optimized** docs at https://docs.astro.build/llms.txt.
- Fetch **Full docs** at https://docs.astro.build/ (primary source, use when llms.txt lacks info).

## Running Tests

- Run `pnpm test` in workspace root or package directory to run full test suite (can be slow!)
- Integration tests live in special `packages/integrations` folders.
- Example: `pnpm -C <package-directory> astro-scripts test` - Run a single package test suite
- Example: `pnpm -C <package-directory> astro-scripts test "test/actions.test.js"` - Run a single test file
- Example: `pnpm -C <package-directory> astro-scripts test "test/**/*.test.js" --match "CSS"` - Run specific tests matching a string or regex patterns
- Example: `pnpm -C <package-directory> astro-scripts test "test/{actions,css,middleware}.test.js"` - Run multiple test files
- Key flags:
  - `--match` / `-m`: Filter tests by name pattern (regex)
  - `--only` / `-o`: Run only tests marked with `.only`
  - `--parallel` / `-p`: Run tests in parallel (default is sequential)
  - `--timeout` / `-t`: Set timeout in milliseconds
  - `--watch` / `-w`: Watch mode
