# Fix

Develop and verify a fix for a diagnosed Astro bug.

**CRITICAL: You MUST always append to `report.md` before finishing, regardless of outcome. Even if the fix attempt fails, you encounter errors, or you cannot resolve the bug — always update `report.md` with your findings. The orchestrator and downstream skills depend on this file to determine what happened.**

## Prerequisites

- A diagnosed bug exists in the `triageDir` directory (provided in args)
- `report.md` in that directory documents the root cause and affected files
- Diagnosis confidence is `medium` or `high`

## Overview

1. Review the diagnosis from `report.md`
2. Implement a minimal fix in `packages/`
3. Rebuild the affected package(s)
4. Verify the fix resolves the reproduction
5. Ensure no regressions
6. Generate git diff
7. Append fix details to `report.md`

## Step 1: Review the Diagnosis

Read `report.md` from the `triageDir` directory (provided in args) to understand:
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
cd <triageDir>
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

Append your fix details to the existing `report.md` (written by reproduce and diagnose skills).

Include a new section with: what you changed, why, the full git diff, verification results, and any tradeoffs or alternative approaches considered.

The report must include all information needed for a final GitHub comment to be generated later by the comment skill. Make sure to include:
- What was changed and why
- The full git diff
- Whether the fix was successful or not
- Verification results (did the fix resolve the original error?)
- Any alternative approaches considered and their tradeoffs
- If the fix failed: what was tried and why it didn't work
