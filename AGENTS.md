# Style Guide

- Not defined here. For now, follow the same conventions and patterns that you detect in the surrounding code.
- Keep formatting consistent. Our rules are defined in our [biome.jsonc](./biome.jsonc) file, enforced by Biome.
- Run `pnpm format` to auto-format the entire repo.
- Run `pnpm lint` to lint the entire repo.

# Monorepo Structure

- This directory is a Git monorepo containing a `pnpm` workspace. The codebase is primarily TypeScript.
- All packages live in `packages/`.
- Integration packages live in `packages/integrations/`.
- The core Astro package is `packages/astro`.

In error stack traces, built files from workspace packages in `node_modules/` map to TypeScript source in `packages/`:

- `node_modules/astro/dist/...` → `packages/astro/src/...`
- `node_modules/@astrojs/react/...` → `packages/integrations/react/src/...`

Note: Edits to source files take effect after rebuilding the package via `pnpm build`.

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
- Use `pnpm -C <dir> <command>` for project-local script commands when working in packages/examples/triage directories. Only omit `-C` flag when intentionally working in the monorepo root. (Example: `pnpm -C packages/astro build`, `pnpm -C examples/blog dev`)
- Use `agent-browser` for web automation or when UI interaction, long-running browsers, or HMR testing is required. Use `agent-browser --help` for all commands. Use this core workflow:
  - Example: `agent-browser open <url>` - Navigate to page
  - Example: `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
  - Example: `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
  - Re-snapshot after page changes.
  - Note: If you can't find `agent-browser`, your machine may not have it installed. If this happens, ask the user to run `npm install -g agent-browser && agent-browser install`. If you are running in headless mode with no human operator and need this tool to complete your job, it is best to fail the job vs. trying to work around not having the tool.

# Pull Request Guidelines

## Branch Naming

Use descriptive kebab-case branch names with a prefix:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code restructuring
- `chore/` - Maintenance, dependencies

Example: `feat/add-view-transitions-support`, `fix/css-scoping-regression`

## Commit Messages

Use [conventional commits](https://www.conventionalcommits.org/):

```
feat: add View Transitions support for SVG
fix: resolve CSS scoping regression in nested components
docs: update integration guide for React 19
refactor: simplify middleware pipeline
chore: update dependencies
```

## Changesets

This repo uses changesets. If your change affects published packages (features, fixes — not docs/chore), create a changeset:

```bash
pnpm changeset add --empty
```

Then edit the generated file in `.changeset/` to add the package name, bump type, and summary. For example:

```markdown
---
'astro': patch
---

Fix CSS scoping regression in nested components
```

- `feat:` → minor bump
- `fix:` → patch bump
- `docs:`, `chore:`, `refactor:` → usually no changeset needed

## PR Description

Every PR **must** use the repo's PR template at [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). Fill in all sections:

1. **Changes** — Short, concise bullet points describing what changed and why.
2. **Testing** — How you verified the change works (tests added/updated, manual steps). Never delete this section — if no tests were added, explain why.
3. **Docs** — Whether this could affect user behavior and if docs updates are needed.

### AI Disclosure

If the PR was authored or co-authored using an AI tool (e.g. Claude, Copilot, Cursor, OpenCode), this **must** be disclosed in the PR description. Use one of the following labels:

- **`AI-generated`** — The contribution was primarily generated by an AI tool with human review.
- **`AI-assisted`** — A human wrote the contribution with help from AI tools (e.g. code completion, suggestions, debugging).

Include this as a line in the PR description, e.g.:

```
> AI-assisted: Co-authored using OpenCode (Claude)
```

or

```
> AI-generated: Generated by Claude with human review and testing
```

## Workflow

1. Always create a branch from `main` — never push directly.
2. Make changes and commit using conventional commit messages.
3. Create a changeset if needed.
4. Run tests (`pnpm test`) and fix any failures.
5. Push the branch and create a PR via `gh pr create`.
