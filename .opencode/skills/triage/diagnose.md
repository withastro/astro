# Diagnose

Find the root cause of a reproduced bug in the Astro source code.

**CRITICAL: You MUST always append to `report.md` before finishing, regardless of outcome. Even if you cannot identify the root cause, hit errors, or the investigation is inconclusive — always update `report.md` with your findings. The orchestrator and downstream skills depend on this file to determine what happened.**

## Prerequisites

- A reproducible bug exists in the `triageDir` directory (provided in args)
- `report.md` in that directory documents the reproduction results

## Overview

1. Review the reproduction and error details from `report.md`
2. Locate relevant source files in `packages/`
3. Add instrumentation to understand the code path
4. Identify the root cause
5. Append diagnosis findings to `report.md`

## Step 1: Review the Reproduction

Read `report.md` from the `triageDir` directory (provided in args) to understand:
- The exact error message and stack trace
- Which command triggers the issue (build/dev/preview)
- What user code is involved

**Skip if not reproduced:** If `report.md` shows the bug was NOT reproduced or was skipped (look for "could not reproduce", "SKIP REASON", "skipped: true"), append "DIAGNOSIS SKIPPED: No reproduction" to `report.md` and return `confidence: null`.

Re-run the reproduction if needed to see the error firsthand:
```bash
cd <triageDir>
pnpm run build  # or dev/preview
```

## Step 2: Locate Source Files

The Astro source is organized as:

```
packages/
├── astro/                    # Core framework
│   └── src/
│       ├── core/             # Build pipeline, rendering, routing
│       ├── vite-plugin-astro/ # Vite integration
│       ├── content/          # Content collections
│       └── ...
├── integrations/
│   ├── react/               # @astrojs/react
│   ├── node/                # @astrojs/node
│   ├── cloudflare/          # @astrojs/cloudflare
│   └── ...
└── markdown/
    └── remark/              # Markdown processing
```

Use the stack trace to find relevant files. The error locations in `node_modules/` map to source files in `packages/`:
- `node_modules/astro/dist/...` → `packages/astro/src/...`
- `node_modules/@astrojs/react/...` → `packages/integrations/react/src/...`

## Step 3: Investigate with Instrumentation

Add `console.log` statements to understand the code path:

```typescript
// In packages/astro/src/core/build/index.ts
console.log('[DEBUG] Building page:', pagePath);
console.log('[DEBUG] Props:', JSON.stringify(props, null, 2));
```

After adding logs:
1. Rebuild the package:
   ```bash
   cd packages/astro  # or the relevant package
   pnpm build
   ```
2. Re-run the reproduction:
   ```bash
   cd <triageDir>
   pnpm run build
   ```
3. Observe the debug output

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
