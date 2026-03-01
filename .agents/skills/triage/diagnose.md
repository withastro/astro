# Diagnose

Find the root cause of a reproduced bug in the Astro source code.

**CRITICAL: You MUST always read `report.md` and append to `report.md` before finishing, regardless of outcome. Even if you cannot identify the root cause, hit errors, or the investigation is inconclusive — always update `report.md` with your findings. The orchestrator and downstream skills depend on this file to determine what happened.**

**SCOPE: Your job is diagnosis only. Finish your work once you've completed this workflow. Do NOT go further than this (no larger verification of the issue, no fixing of the issue, etc.).**

## Prerequisites

These variables are referenced throughout this skill. They may be passed as args by an orchestrator, or inferred from the conversation when run standalone.

- **`triageDir`** — Directory containing the reproduction project (e.g. `triage/issue-123`). If not passed as an arg, infer from previous conversation.
- **`issueDetails`** - The GitHub API issue details payload. This must be provided explicitly by the user or available from prior conversation context / tool calls. If this data isn't available, you may run `gh issue view ${issue_number}` to load the missing issue details directly from GitHub.
- **`report.md`** — File in `triageDir` that MAY exist. Contains the full context from all previous skills.
- **Astro Compiler source** — The `withastro/compiler` repo MAY be cloned at `.compiler/` (inside the repo root, gitignored). If it exists, treat it as in-scope for diagnosis. Some bugs originate in the compiler rather than in `packages/` — if stack traces or investigation point to compiler behavior (e.g. HTML parsing, `.astro` file transformation), check `.compiler/` for relevant source code.

## Overview

1. Review the reproduction and error details from `report.md`
2. Locate the relevant source files in `packages/`
3. Add instrumentation to understand the code path
4. Identify the root cause
5. Append diagnosis findings to `report.md`

## Step 1: Review the Reproduction

Start by reading `report.md` from the `triageDir` directory.

**Skip if not reproduced:** If `report.md` shows the bug was NOT reproduced or was skipped (look for "could not reproduce", "SKIP REASON", "skipped: true"), append "DIAGNOSIS SKIPPED: No reproduction" to `report.md` and return `confidence: null`.

Re-run the reproduction if needed to see the error firsthand:

```bash
pnpm -C <triageDir> run build  # or dev/preview
```

## Step 2: Locate Relevant Source Files

Using the error messages, stack traces, and any other reproduction details from Step 1, identify the source files in `packages/` that are likely involved.

## Step 3: Investigate with Instrumentation

Add `console.log` statements to understand the code path:

```typescript
// In packages/astro/src/core/build/index.ts
console.log('[DEBUG] Building page:', pagePath);
console.log('[DEBUG] Props:', JSON.stringify(props, null, 2));
```

After adding logs:

1. Rebuild the package (Example: `pnpm -C packages/astro build`)
2. Re-run the reproduction (Example: `pnpm -C <triageDir> build|dev|preview`)
3. Observe the debug output.

Iterate until you understand:

- What code path is executing
- What data is being passed
- Where the logic diverges from expected behavior

## Step 4: Identify Root Cause

Once you understand the issue, document:

1. **Which file(s)** contain the bug
2. **What the code does wrong** — the specific logic error
3. **Why this causes the observed behavior** — how the error manifests
4. **What the fix should be** — high-level approach

Consider:

- Is this a regression from a recent change?
- Does this affect other similar use cases?
- Are there edge cases to consider?

## Step 5: Write Output

Append your diagnosis findings to the existing `report.md` (written by the reproduce skill).

Include a new section with everything you learned: the root cause, affected files with line numbers, detailed explanation of the code path, instrumentation results, and your suggested fix approach. This helps the fix skill work faster.

The report must include all information needed for a final GitHub comment to be generated later by the comment skill. Make sure to include:

- Root cause explanation (which files, what logic is wrong, why)
- Affected file paths with line numbers
- Suggested fix approach
- Confidence level (`high`, `medium`, or `low`) and any caveats
