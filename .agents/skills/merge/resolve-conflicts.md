# Resolve Merge Conflicts

Resolve merge conflicts from merging `main` into the `next` branch.

**SCOPE: Do not spawn tasks/sub-agents.**

## Prerequisites

- **`prNumber`** — The PR number for the merge PR.
- **`branch`** — The branch name (e.g., `ci/merge-main-to-next`).
- The working directory is the repo root, checked out on the merge branch with conflict markers present.

## Strategy

When resolving conflicts, follow these rules based on file type:

### Changeset files (`.changeset/*.md`)

- If a changeset file exists on `main` but not on `next`, it was likely already released. **Delete it.** The clean-changesets skill will handle this more thoroughly, but removing obvious ones here unblocks the merge.
- If both branches modified the same changeset, prefer the `next` version since it's the one targeting the upcoming major.

### `package.json` and version files

- **Prefer `next` branch versions.** The `next` branch has the pre-release versions (alpha/beta) which should not be overwritten by `main`'s stable versions.
- For dependency version updates from `main`, accept those — they are typically patches/minors that should be forward-ported.

### `pnpm-lock.yaml`

- Do not try to manually resolve lockfile conflicts. Instead:
  1. Accept the `next` version: `git checkout --theirs pnpm-lock.yaml`
  2. The lockfile will be regenerated after `pnpm install` later.

### Source code (`packages/**/*.ts`, `packages/**/*.js`)

- **Prefer `main` for bug fixes.** If `main` fixed a bug, that fix should carry over to `next`.
- **Prefer `next` for API changes.** If `next` changed an API (new major version features), keep the `next` version and adapt the `main` fix to work with it if needed.
- When in doubt, prefer `next` — it's the forward-looking branch.

### Test files

- If tests conflict, prefer `next` and adapt. Tests on `next` may test new major-version behavior.

### Configuration files (`.changeset/config.json`, `tsconfig.json`, etc.)

- Prefer `next` unless `main` has a clear fix that should be forward-ported.

## Steps

1. Run `git diff --name-only --diff-filter=U` to list all conflicted files.
2. For each conflicted file, read the file and resolve the conflict following the strategy above.
3. After resolving each file, run `git add <file>` to mark it as resolved.
4. After all files are resolved, verify no conflict markers remain: `grep -r "<<<<<<< " --include="*.ts" --include="*.js" --include="*.json" --include="*.yaml" --include="*.yml" --include="*.md" .`
5. Do NOT commit — the orchestrator will handle committing.

## Output

Return the list of files that were resolved and whether all conflicts were successfully handled.
