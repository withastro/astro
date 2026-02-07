---
name: fix
description: Fix a diagnosed Astro bug. Use after the diagnose skill has identified the root cause. Develops a minimal fix in the monorepo source, rebuilds, and verifies the fix resolves the reproduction.
---

# Fix Skill

Develop and verify a fix for a diagnosed Astro bug.

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
6. Write structured output to `fix.json`

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
  "notes": "Minimal change that only affects client:only components. No impact on normal SSR."
}
```

**Field definitions:**
- `fixed`: `true` if the bug is resolved, `false` if fix attempt failed
- `files`: Array of files modified in `packages/`
- `description`: What the fix does and why
- `gitDiff`: Full output of `git diff packages/`
- `verificationSteps`: How to verify the fix works
- `notes`: Additional context (tradeoffs, alternatives considered, etc.)

If you can't fix the bug, set `fixed: false` and explain what you tried in `notes`.

### 7b: Update `report.md` — Append fix context

Read the existing `report.md` (written by reproduce and diagnose skills). Append a new section with your fix details: what you changed, why, the full git diff, verification results, and any tradeoffs or alternative approaches considered.

### 7c: Overwrite `comment.md` — Final GitHub issue reply

Read the existing `report.md` to get the full reproduction and diagnosis context. Write a new self-contained `comment.md` that incorporates everything:

**If the fix succeeded:**

```markdown
## Automated Triage Report

**Status:** Reproduced and fixed

**Cause:** [One sentence root cause]
**Fix:** [One sentence fix summary]

<details>
<summary><strong>Reproduction Details</strong></summary>

### Environment
- **Astro:** [version]
- **Node.js:** [version]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]

### Error Observed
```
[Error message]
```

</details>

<details>
<summary><strong>Root Cause Analysis</strong></summary>

[Explanation of the root cause]

**Affected files:**
- `[file1:line]`
- `[file2:line]`

</details>

<details>
<summary><strong>Proposed Fix</strong></summary>

[Fix description — what was changed and why]

### Changes

```diff
[git diff from fix.json]
```

### Verification
[Steps taken to verify the fix works]

</details>

---
*This comment was generated by automated triage. Fixes require maintainer review before merging.*
```

**If the fix did NOT succeed:**

```markdown
## Automated Triage Report

**Status:** Reproduced — Fix attempted but unsuccessful

**Cause:** [One sentence root cause]

<details>
<summary><strong>Reproduction Details</strong></summary>

[Environment, steps, error from report.md]

</details>

<details>
<summary><strong>Root Cause Analysis</strong></summary>

[Explanation from report.md]

</details>

### Fix Attempt
[What was tried and why it didn't work]

---
*This comment was generated by automated triage. A maintainer will need to investigate further.*
```

The comment must be **self-contained** — include all context from `report.md`, not just references.
