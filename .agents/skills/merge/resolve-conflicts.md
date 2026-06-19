# Resolve Merge Conflicts

Resolve all merge conflicts from a `git merge origin/main` into `next`. The working tree has conflict markers in all affected files. Your job is to resolve every conflict so that `pnpm install` and `pnpm build` can succeed.

**SCOPE: Do not spawn tasks/sub-agents.**

## Prerequisites

- **`branch`** — The branch name (e.g., `ci/merge-main-to-next`).
- **`hasConflicts`** — Whether the merge had conflicts.
- The working directory is the repo root, checked out on the merge branch.
- `git merge origin/main` has been run but NOT committed — conflict markers are present in the working tree.
- Dependencies are NOT installed yet. Do not run `pnpm install` — the orchestrator will do that after you finish.

## Steps

### Step 1: Find all conflicted files

```bash
# List all files with conflict markers
grep -rl "<<<<<<< " . --include="*.ts" --include="*.js" --include="*.mjs" --include="*.cjs" --include="*.md" --include="*.astro" --include="*.json" --include="*.yaml" --include="*.yml" | grep -v node_modules | sort
```

### Step 2: Resolve conflicts by file type

For each conflicted file, resolve using these rules:

#### `package.json` files

- **`version` fields** — Always keep `next`'s pre-release version (e.g., `5.0.0-beta.1`). NEVER use `main`'s stable version.
- **Dependencies** — Keep `next`'s versions for shared deps. If `main` added a NEW dependency that doesn't exist on `next`, include it. If `main` swapped a dependency for a different one (e.g., `get-tsconfig` → `tsconfck`), keep whichever the source code on `next` actually imports.
- **Scripts** — Merge both sides: keep `next`'s scripts and add any new scripts from `main`.
- **Other fields** — Prefer `next` unless `main` has an obvious bug fix.

#### `pnpm-lock.yaml`

- Do NOT try to manually resolve the lockfile. Just delete it — the orchestrator will regenerate it via `pnpm install --no-frozen-lockfile` after you're done.

```bash
git checkout --theirs pnpm-lock.yaml 2>/dev/null || true
```

#### Source code (`.ts`, `.js`, `.mjs`, `.cjs`, `.astro`)

- **Bug fixes from `main`** — If `main` fixed a bug, that fix should carry over to `next`. Adapt the fix to `next`'s API if needed.
- **API changes on `next`** — If `next` changed an API, keep the `next` version and adapt the `main` code if needed.
- When in doubt, prefer `next` — it's the forward-looking branch.

#### Markdown and config files

- **Changesets** (`.changeset/*.md`) — will be handled by the clean-changesets skill. For now just accept both sides.
- **Other `.md` files** — prefer `next`.

### Step 3: Stage resolved files

After resolving each file, stage it:

```bash
git add <resolved-file>
```

### Step 4: Verify no conflict markers remain

```bash
grep -r "<<<<<<< \|=======$\|>>>>>>> " . --include="*.ts" --include="*.js" --include="*.mjs" --include="*.cjs" --include="*.md" --include="*.astro" --include="*.json" --include="*.yaml" --include="*.yml" | grep -v node_modules
```

If any remain, resolve them.

### Step 5: Do NOT commit or install

The orchestrator handles committing, installing, and building.

## Output

Return the list of files where conflicts were resolved.
