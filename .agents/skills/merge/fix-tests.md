# Fix Test Failures

Fix test failures identified from CI logs on the merge PR. Do NOT re-run the full test suite — CI has already done that. Instead, analyze the CI failure logs and fix the specific failures.

**SCOPE: Do not spawn tasks/sub-agents.**

## Prerequisites

- **`prNumber`** — The PR number for the merge PR.
- The working directory is the repo root, checked out on the merge branch.
- Merge conflicts should already be resolved before this skill runs.
- CI has already run and failed — you need to look at those logs.

## Overview

This skill follows a "fix and push" approach. After pushing, CI will re-run automatically. If there are still failures, this workflow will be triggered again (up to 3 total attempts). So you don't need to fix everything in one pass — focus on the failures visible in the current CI logs.

## Steps

### Step 1: Build all packages

Before analyzing test failures, ensure all packages are built:

```bash
pnpm build
```

Fix any build errors first — these may be the cause of test failures downstream.

### Step 2: Get CI failure logs

Use the GitHub CLI to find the failed CI run and download its logs:

```bash
# List recent workflow runs on this branch
gh run list --branch ci/merge-main-to-next --workflow ci.yml --limit 5 --json databaseId,status,conclusion

# Get the most recent failed run
gh run view <run-id> --log-failed
```

Parse the output to identify:

- Which test files failed
- The specific test names that failed
- The error messages and assertion diffs

### Step 3: Analyze failures

For each failure, determine the cause:

1. **Snapshot/output mismatch** — Test expects specific HTML/output but got something different. This is common when the `next` branch uses a newer compiler or has API changes. Fix by updating the expected output to match the new behavior.

2. **Import/module errors** — Code from `main` references modules or exports that changed on `next`. Fix by updating imports or adapting the code.

3. **Type errors** — TypeScript compilation failures from API changes between branches. Fix by updating types.

4. **Configuration mismatches** — Test fixtures using config options that changed on `next`. Fix by updating the fixture config.

### Step 4: Fix the failures

For each failure:

1. **Read the failing test file** to understand what it's testing
2. **Read the source code** it's testing if needed
3. **Make the minimal fix** — only change what's needed to make the test pass

**Fix principles:**

- Keep changes minimal — only fix what CI reported as failing
- Don't refactor unrelated code
- Don't change test intent — only adapt expectations to the current branch state
- If a test expectation needs updating (e.g., expected HTML output changed), update it to match the new correct output

**What NOT to fix:**

- Tests that were already failing on `next` before the merge — check with `git log origin/next -- <test-file>` if unsure
- Smoke tests — these are allowed to fail
- `astro check` failures — these are permitted to fail

### Step 5: Verify fixes locally (targeted only)

Only run the specific tests you fixed, not the full suite:

```bash
pnpm -C <package-directory> exec astro-scripts test "test/<specific-test>.test.js"
```

This is a quick sanity check, not a replacement for CI. CI will do the full validation after you push.

### Step 6: Rebuild if source files were modified

If you modified any source files in `packages/` (not just test files), rebuild the affected package:

```bash
pnpm -C packages/<affected-package> build
```

Then re-run the specific affected tests to confirm.

### Step 7: Ensure dependencies are up to date

If the merge introduced new dependencies or changed versions, run:

```bash
pnpm install --no-frozen-lockfile
```

## Output

Return:

- Whether all identified test failures were fixed
- List of files that were modified
- List of any remaining failures that could not be fixed automatically (e.g., require deeper architectural understanding)
