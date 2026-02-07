---
name: fix
description: Fix a diagnosed Astro bug. Use after the diagnose skill has identified the root cause. Develops a minimal fix in the monorepo source, rebuilds, and verifies the fix resolves the reproduction.
---

# Fix Skill

Develop and verify a fix for a diagnosed Astro bug.

**CRITICAL: You MUST always write `fix.json` and append to `report.md` before finishing, regardless of outcome. Even if the fix attempt fails, you encounter errors, or you cannot resolve the bug — always write the output files (use `fixed: false` if the fix didn't work). The orchestrator depends on these files to determine what happened.**

## Prerequisites

- A diagnosed bug exists in a triage directory
- `diagnosis.json` shows the root cause and affected files
- Confidence is `medium` or `high`

## Overview

1. Review the diagnosis
2. Implement a minimal fix in `packages/`
3. Rebuild the affected package(s)
4. Verify the fix resolves the reproduction
5. Ensure no regressions
6. Generate git diff
7. Write structured output to `fix.json` and `report.md`
8. If confident, push fix to a branch

## Step 1: Review the Diagnosis

Read `triage/<dir>/diagnosis.json` to understand:
- The root cause and affected files
- The suggested approach
- Any edge cases to consider

## Step 2: Implement the Fix

Make changes in `packages/` source files. Follow these principles:

**Keep it minimal:**
- Only change what's necessary to fix the bug
- Don't refactor unrelated code
- Don't add new features

**Match existing style:**
- Use the same patterns as surrounding code
- Follow the project's TypeScript conventions
- Keep consistent formatting

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
cd packages/astro  # or packages/integrations/<name>
pnpm build
```

Watch for build errors — fix any TypeScript issues before proceeding.

## Step 4: Verify the Fix

Re-run the reproduction:

```bash
cd triage/<dir>
pnpm run build  # or dev/preview, whichever triggers the bug
```

The original error should be gone. If using dev server, test with `agent-browser`:

```bash
npx agent-browser http://localhost:4321/affected-page
```

## Step 5: Check for Regressions

Test that normal cases still work:

1. **Basic functionality** — does a simple page still build/serve?
2. **Related features** — do similar but non-buggy use cases work?
3. **Edge cases** — what about empty values, special characters, etc.?

If you find regressions, refine the fix to handle all cases.

## Step 6: Generate Git Diff

From the repository root, generate the diff:

```bash
git diff packages/
```

This captures all your changes for the report.

## Step 7: Write Output

Write three output files to the triage directory:

### 7a: `fix.json` — Structured data for the orchestrator

```json
{
  "fixed": true,
  "files": [
    "packages/astro/src/core/render/component.ts"
  ],
  "description": "Added guard to skip SSR rendering for client:only components. When a component has the client:only directive, we now return a placeholder astro-island element instead of attempting to render server-side.",
  "gitDiff": "diff --git a/packages/astro/src/core/render/component.ts...",
  "verificationSteps": [
    "Run pnpm run build in the triage project",
    "Build should complete without errors",
    "The page with client:only component should render correctly"
  ],
  "notes": "Minimal change that only affects client:only components. No impact on normal SSR.",
  "branchPushed": "triage/12345"
}
```

**Field definitions:**
- `fixed`: `true` if the bug is resolved, `false` if fix attempt failed
- `files`: Array of files modified in `packages/`
- `description`: What the fix does and why
- `gitDiff`: Full output of `git diff packages/`
- `verificationSteps`: How to verify the fix works
- `notes`: Additional context (tradeoffs, alternatives considered, etc.)
- `branchPushed`: Name of the branch pushed to origin (e.g. `triage/12345`), or `null` if not pushed

If you can't fix the bug, set `fixed: false` and explain what you tried in `notes`.

### 7b: Update `report.md` — Append fix context

Read the existing `report.md` (written by reproduce and diagnose skills). Append a new section with your fix details: what you changed, why, the full git diff, verification results, and any tradeoffs or alternative approaches considered.

The report must include all information needed for a final GitHub comment to be generated later by the comment skill. Make sure to include:
- What was changed and why
- The full git diff
- Verification results (did the fix resolve the original error?)
- Any alternative approaches considered and their tradeoffs
- If the fix failed: what was tried and why it didn't work

## Step 8: Push Fix Branch

**Only do this if `fixed: true` and you are confident in the fix.** Skip this step entirely if the fix didn't work or you have doubts.

From the repository root:

```bash
git checkout -b triage/<issue_number>
git add packages/
git commit -m "fix: <brief description> (#<issue_number>)"
git push origin triage/<issue_number>
```

**Important rules:**
- Only commit changes in `packages/` — do NOT commit triage directory files, report.md, or JSON output files
- Try once. If any step fails (auth error, branch already exists, push rejected, etc.), give up and move on. Do NOT retry, do NOT attempt to debug or fix the failure, and do NOT do anything outside this scope to resolve it.
- Update the `branchPushed` field in `fix.json` with the branch name if successful, or `null` if it failed or was skipped
