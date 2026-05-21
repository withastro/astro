# Clean Changesets

Remove changeset files that were already released on `main` and should not be included in the `next` branch's pre-release versioning.

**SCOPE: Do not spawn tasks/sub-agents.**

## Prerequisites

- The working directory is the repo root, checked out on the merge branch.
- Dependencies may NOT be installed yet — do not run any `pnpm` commands that require `node_modules`.

## Background

When `main` is merged into `next`, changeset files (`.changeset/*.md`) that were consumed by a release on `main` may still appear as new files on `next` if the `next` branch diverged before that release. These stale changesets cause pre-release versions on `next` to include version bumps that were already released as stable versions, leading to version conflicts like `@astrojs/sitemap@3.6.1-beta.3` being published after `@astrojs/sitemap@3.7.0`.

## Steps

1. **Identify stale changesets.** Compare the changeset files on this branch against what exists on `origin/next`:

   ```bash
   # List changeset .md files that are new (not in next already)
   git diff --name-only --diff-filter=A origin/next -- .changeset/
   ```

2. **Check each new changeset.** For each file found:
   - Read the file contents to see which packages it bumps
   - Check if those bumps have already been released on `main` by looking at the current versions in `package.json` files on `origin/main`
   - A changeset is stale if the version bump it describes has already been released

3. **Also check `pre.json`.** Read `.changeset/pre.json` if it exists. This file tracks the pre-release state. Ensure it does not reference any changesets that should be removed.

4. **Remove stale changesets.** Delete the identified files:

   ```bash
   git rm .changeset/<stale-file>.md
   ```

5. **Verify.** Check that the remaining changeset `.md` files look valid (proper frontmatter with package names and bump types).

6. Do NOT commit or run `pnpm install` — the orchestrator will handle that.

## Important Notes

- Do NOT remove changesets that are specific to `next` (ones that describe major version changes or new features being developed on `next`).
- Do NOT remove the `.changeset/config.json` file.
- Do NOT remove `.changeset/pre.json` — it's needed for pre-release mode.
- If unsure whether a changeset is stale, err on the side of keeping it. A human reviewer can remove it later.

## Output

Return the list of changeset files that were removed.
