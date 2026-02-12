## Style Guide

- Not defined here. For now, follow the same conventions and patterns that you detect in the surrounding code. Keep
- Keep formatting consistent. Our rules are defined in our [biome.jsonc](./biome.jsonc) file, enforced by Biome.
- Run `pnpm format` to auto-format the entire repo.
- Run `pnpm lint` to lint the entire repo.

# Source Structure

This is a pnpm workspace monorepo with the following directory structure:

```
packages/
├── astro/                    # astro -- The core framework package
│   └── src/
│       ├── core/             # Build pipeline, rendering, routing
│       ├── vite-plugin-astro/ # Vite integration
│       ├── content/          # Content collections
│       └── ...
├── integrations/
│   ├── react/               # @astrojs/react
│   ├── node/                # @astrojs/node
│   ├── cloudflare/          # @astrojs/cloudflare
│   └── ...
└── markdown/
    └── remark/              # @astrojs/markdown-remark
```

When you run `pnpm install`, source packages in `packages/` are symlinked into `node_modules/` of their dependants via `workspace:*` dependencies.

In error stack traces, built files in `node_modules/` will often map to TypeScript source files in the `packages/` directory.

- `node_modules/astro/dist/...` → `packages/astro/src/...`
- `node_modules/@astrojs/react/...` → `packages/integrations/react/src/...`

Note: Edits to source files take effect after rebuilding the package via `pnpm build`.

# Running Tests

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

# Astro Quick Reference

- Use `astro dev` to start the local dev server with HMR.
- Use `astro build` to create a production build in `dist/` (static or Node server).
- Use `astro preview` to serve the production build locally (static or Node server).
- Use `astro check` to run type checking and diagnostics.
- Use `astro sync` to generate and update TypeScript types.
- Use `astro add` to install and configure an official integration.
- Fetch **LLM-optimized** docs at https://docs.astro.build/llms.txt.
- Fetch **Full docs** at https://docs.astro.build/ (primary source, use when llms.txt lacks info).

# Working with Astro

- Use `astro dev` and `astro preview` in the background to prevent hanging your entire session, and use `&` to run them in the background. Use `--port RANDOM_NUMBER --strictPort` to avoid port conflicts. Cleanup old servers when you're done.
- Use `astro dev` and `astro preview` as web servers for Astro project. They are reliable. Don't use other web servers for testing.
- Use `pnpm -C <dir> <command>` for project-local commands when working in packages/examples/triage directories. Only omit `-C` flag when intentionally working in the monorepo root. (Example: `pnpm -C packages/astro build`, `pnpm -C examples/blog dev`)
- Use `agent-browser` for web automation or when UI interaction, long-running browsers, or HMR testing is required. Use `agent-browser --help` for all commands. Use this core workflow:
  - Example: `agent-browser open <url>` - Navigate to page
  - Example: `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
  - Example: `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
  - Re-snapshot after page changes.
  - Note: If you can't find `agent-browser`, your machine may not have it installed. If this happens, ask the user to run `npm install -g agent-browser && agent-browser install`. If you are running in headless mode with no human operator and need this tool to complete your job, it is best to fail the job vs. trying to work around not having the tool.
