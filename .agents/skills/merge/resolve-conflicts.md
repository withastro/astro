# Verify Merge Conflict Resolutions

Verify that the automated conflict resolution (which kept the "ours"/next side for JSON and YAML files) was correct, and fix any issues.

**SCOPE: Do not spawn tasks/sub-agents.**

## Prerequisites

- **`prNumber`** — The PR number for the merge PR.
- **`branch`** — The branch name (e.g., `ci/merge-main-to-next`).
- The working directory is the repo root, checked out on the merge branch.
- Dependencies are installed and packages are built.
- Conflict markers in JSON/YAML files have already been stripped by the GitHub Action, keeping the "ours" (next) side. Source code files (`.ts`, `.js`, `.md`, `.astro`) may still have conflict markers.

## Background

The GitHub Action strips conflict markers from JSON/YAML files before `pnpm install` can run, always keeping the `next` branch side. This is usually correct (next has pre-release versions that must be preserved), but it may discard important changes from `main` — like new dependencies, updated dependency versions, or config changes from bug fixes.

## Steps

### Step 1: Resolve any remaining conflict markers

Check for conflict markers in source code files:

```bash
grep -r "<<<<<<< " --include="*.ts" --include="*.js" --include="*.mjs" --include="*.cjs" --include="*.md" --include="*.astro" . 2>/dev/null | grep -v node_modules
```

If any exist, resolve them following these rules:

- **Prefer `main` for bug fixes.** If `main` fixed a bug, that fix should carry over to `next`.
- **Prefer `next` for API changes.** If `next` changed an API, keep the `next` version and adapt the `main` fix if needed.
- When in doubt, prefer `next` — it's the forward-looking branch.

After resolving, `git add` each file.

### Step 2: Review what was lost from main

Compare what `main` had in the conflicted files against what we kept:

```bash
# List files that were modified on both branches (potential conflict sites)
git diff --name-only origin/next...origin/main -- '*.json' '*.yaml' '*.yml'
```

For each file, compare the `main` version to the current version:

```bash
git diff origin/main -- <file>
```

Look for:

- **New dependencies** added on `main` that are missing from `next` — these should be added
- **Dependency version bumps** on `main` that are higher than what's on `next` — these should typically be accepted (they're patches/minors)
- **New scripts or config entries** added on `main` — these should be forward-ported
- **Version fields** (`"version":`) — keep `next`'s pre-release versions, do NOT use `main`'s stable versions

### Step 3: Apply corrections

If you find changes from `main` that should have been kept:

1. Apply those specific changes to the current files
2. Run `pnpm install --no-frozen-lockfile` if you modified any `package.json` files
3. `git add` the modified files

### Step 4: Do NOT commit

The orchestrator will handle committing.

## Output

Return whether the conflict resolutions were correct and what files (if any) needed corrections.
