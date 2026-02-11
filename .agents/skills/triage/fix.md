# Fix

Develop and verify a fix for a diagnosed Astro bug.

**CRITICAL: You MUST always append to `report.md` before finishing, regardless of outcome. Even if the fix attempt fails, you encounter errors, or you cannot resolve the bug — always update `report.md` with your findings. The orchestrator and downstream skills depend on this file to determine what happened.**

## Prerequisites

These variables are referenced throughout this skill. They may be passed as args by an orchestrator, or inferred from the conversation when run standalone.

- **`triageDir`** — Directory containing the reproduction project (e.g. `triage/issue-123`). If not passed as an arg, infer from previous conversation.
- **`report.md`** — File in `triageDir` that MAY exist. Contains the full context from all previous skills.

## Overview

1. Review the diagnosis from `report.md`
2. Implement a minimal fix in `packages/`
3. Rebuild the affected package(s)
4. Verify the fix resolves the reproduction
5. Ensure no regressions
6. Generate git diff
7. Append fix details to `report.md`

## Step 1: Review the Diagnosis

Read `report.md` from the `triageDir` directory to understand:

- The root cause and affected files
- The suggested approach
- Any edge cases to consider

**Skip if prerequisites unmet:** Check `report.md`: If bug not reproduced/skipped OR diagnosis confidence is `low`/`null` OR no root cause found → append "FIX SKIPPED: [reason]" to `report.md` and return `fixed: false`.

**Note:** The repo may be messy from previous steps. Check `git status` and either work from the current state or `git reset --hard` to start clean.

## Step 2: Implement the Fix

Make changes in `packages/` source files. Follow these principles:

**Keep it minimal:**

- Only change what's necessary to fix the bug
- Don't refactor unrelated code
- Don't add new features

**Consider edge cases:**

- Will this break other use cases?
- What happens with unusual input?
- Are there null/undefined checks needed?

Example fix:

```typescript
// Before (in packages/astro/src/core/render/component.ts)
export function renderComponent(component: AstroComponent, props: Props) {
  const html = renderToString(component, props);
  return html;
}

// After
export function renderComponent(component: AstroComponent, props: Props) {
  // Skip SSR for client:only components
  if (props['client:only']) {
    return `<astro-island client="only" component-url="${component.url}"></astro-island>`;
  }
  const html = renderToString(component, props);
  return html;
}
```

## Step 3: Rebuild the Package

After making changes, rebuild the affected package:

```bash
pnpm -C packages/astro build    # or packages/integrations/<name>
```

Watch for build errors — fix any TypeScript issues before proceeding.

## Step 4: Verify the Fix

Re-run the reproduction, often using `pnpm run build`/`astro build` or `pnpm run dev`/`astro dev`.

## Step 5: Check for Regressions

Test that you didn't break anything new, and that normal cases still work. If you find regressions, refine the fix to handle all cases.

## Step 6: Generate Git Diff

From the repository root, generate the diff:

```bash
git diff packages/
```

This captures all your changes for the report.

## Step 7: Write Output

Append your fix details to the existing `report.md` (written by reproduce and diagnose skills).

Include a new section with: what you changed, why, the full git diff, verification results, and any tradeoffs or alternative approaches considered.

The report must include all information needed for a final GitHub comment to be generated later by the comment skill. Make sure to include:

- What was changed and why
- The full git diff (unless it is massive, if it is)
- Whether the fix was successful or not
- Verification results (did the fix resolve the original error?)
- Any alternative approaches considered and their tradeoffs
- If the fix failed: what was tried and why it didn't work

## Step 8: Clean Up the Working Directory

1. Run `git status` and review all changed files
2. Revert any changes that are NOT part of the fix:
   - Debug code, `console.log`s, or temporary test files
   - Changes outside `packages/` that were only needed for diagnosis/reproduction
   - Build artifacts that shouldn't be committed
3. Use `git checkout -- <file>` to discard unwanted changes
4. Confirm with a final `git status` that only the intended fix files remain
5. DO NOT commit or push anything yet! The user will handle that at a later step.

The `triage/` directory is already gitignored, so it won't appear in `git status`.
