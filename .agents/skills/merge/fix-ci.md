# Fix CI Failures

Fix build errors, type errors, and test failures identified from CI logs on the merge PR. The merge-resolve workflow has already resolved conflicts and regenerated the lockfile, but the code may not build or pass tests yet.

**SCOPE: Do not spawn tasks/sub-agents.**

## Prerequisites

- **`prNumber`** — The PR number for the merge PR.
- **`ciLogs`** — The CI failure logs, pre-fetched by the orchestrator. Contains the failed job names and their log output.
- The working directory is the repo root, checked out on the merge branch.
- Merge conflicts have already been resolved and committed by the merge-resolve workflow.
- Dependencies are installed (`pnpm install` has been run).

## Critical Rules

1. **NEVER run `pnpm install`** — dependencies are already installed correctly. The lockfile was generated during the merge action with all conflicts resolved. Running install again (especially `--no-frozen-lockfile`) will re-resolve the entire dependency tree and break transitive dependencies. If a test fails due to a missing module, that's a source code issue to fix, not a dependency issue.

2. **Time-box your investigation.** If you've spent more than 5 minutes analyzing a single failure without attempting a fix, stop investigating and try your best theory. Run the build/test, see if it helps, iterate. Don't trace the entire call chain from first principles.

3. **Diff first, not code-read.** When investigating a failure, start by looking at what changed in the merge (`git diff origin/next...HEAD -- <relevant-files>`), not by reading the full source. The diff shows you exactly what's different.

4. **Batch your bash commands.** Combine related commands into single bash calls instead of running them one at a time. For example, combine `ls`, `grep`, and `cat` operations into one step rather than three separate steps.

## Overview

This skill follows a "fix and push" approach. After pushing, CI will re-run automatically. If there are still failures, this workflow will be triggered again (up to 3 total attempts). So you don't need to fix everything in one pass — focus on the failures visible in the current CI logs.

## Steps

### Step 1: Build all packages

Start by building. This is the first thing CI does, so build errors block everything else:

```bash
pnpm build
```

If the build fails, fix the build errors before moving on to tests. Common build errors after a merge:

- **Type errors** — APIs changed between `main` and `next`. One branch updated a type signature or added a required field, and the other branch's code doesn't match. Fix by adapting the code to the current branch state.
- **Import errors** — A file was moved, renamed, or an export was removed. Fix by updating the import path or adapting to the new API.
- **Duplicate declarations** — Both branches added similar code. Remove the duplicate, keeping the `next` version.

Use the diff to understand what changed:

```bash
git diff origin/next...HEAD -- <path-to-failing-file>
```

After fixing build errors, rebuild the affected package(s) to confirm:

```bash
pnpm -C packages/<affected-package> build
```

Then do a full build to make sure nothing else broke:

```bash
pnpm build
```

### Step 2: Analyze CI failure logs

Once the build passes, look at the `ciLogs` argument to identify test failures:

- Which test files failed
- The specific test names that failed
- The error messages and assertion diffs

**Note:** Do NOT use `gh` CLI commands — they don't work inside the sandbox. All CI log data is provided in the `ciLogs` argument.

### Step 3: Analyze test failures

For each failure, determine the cause by first checking the diff:

```bash
git diff origin/next...HEAD -- <path-to-relevant-source-or-test>
```

Common causes:

1. **Snapshot/output mismatch** — Test expects specific HTML/output but got something different. This is common when the `next` branch uses a newer compiler or has API changes. Fix by updating the expected output to match the new behavior.

2. **Import/module errors** — Code from `main` references modules or exports that changed on `next`. Fix by updating imports or adapting the code.

3. **Type errors in tests** — TypeScript compilation failures from API changes between branches. Fix by updating types.

4. **Configuration mismatches** — Test fixtures using config options that changed on `next`. Fix by updating the fixture config.

### Step 4: Fix the failures

For each failure:

1. **Check the diff** to understand what changed
2. **Read the failing test file** to understand what it's testing
3. **Read the source code** it's testing if needed
4. **Make the minimal fix** — only change what's needed to make it pass

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

Run the test **without piping through grep** so you can see the actual pass/fail result. This is a quick sanity check, not a replacement for CI. CI will do the full validation after you push.

### Step 6: Rebuild if source files were modified

If you modified any source files in `packages/` (not just test files), rebuild the affected package:

```bash
pnpm -C packages/<affected-package> build
```

Then re-run the specific affected tests to confirm.

## Output

Return:

- Whether all identified CI failures were fixed (build + tests)
- List of files that were modified
- List of any remaining failures that could not be fixed automatically (e.g., require deeper architectural understanding)
