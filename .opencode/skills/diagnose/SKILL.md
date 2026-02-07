---
name: diagnose
description: Diagnose the root cause of a reproduced Astro bug. Use after the reproduce skill confirms a bug exists. Traces the error through the source code in packages/ to identify the exact file(s) and logic causing the issue.
---

# Diagnose Skill

Find the root cause of a reproduced bug in the Astro source code.

## Prerequisites

- A reproducible bug exists in a triage directory
- `reproduction.json` shows `reproducible: true`

## Overview

1. Review the reproduction and error details
2. Locate relevant source files in `packages/`
3. Add instrumentation to understand the code path
4. Identify the root cause
5. Write structured output to `diagnosis.json`

## Step 1: Review the Reproduction

Read `triage/<dir>/reproduction.json` to understand:
- The exact error message and stack trace
- Which command triggers the issue (build/dev/preview)
- What user code is involved

Re-run the reproduction if needed to see the error firsthand:
```bash
cd triage/<dir>
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
   cd triage/<dir>
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

Write three output files to the triage directory:

### 5a: `diagnosis.json` — Structured data for the orchestrator

```json
{
  "rootCause": "The renderToString function doesn't handle client:only components correctly",
  "files": [
    "packages/astro/src/core/render/ssr.ts:142",
    "packages/astro/src/core/render/component.ts:89"
  ],
  "explanation": "When a component has client:only directive, the SSR pipeline still attempts to render it server-side. This fails because client:only components are not designed to run in Node.js. The check at line 142 should skip rendering for client:only components and return a placeholder instead.",
  "confidence": "high",
  "suggestedApproach": "Add a guard in renderComponent() to check for client:only directive before attempting SSR. Return a placeholder div with the component's client script instead."
}
```

**Confidence levels:**
- `high`: Root cause is clearly identified, fix path is obvious
- `medium`: Likely root cause identified, but some uncertainty remains
- `low`: Symptoms identified but root cause unclear, more investigation needed

**Field definitions:**
- `rootCause`: One-sentence summary of the bug
- `files`: Array of `file:line` locations involved (most relevant first)
- `explanation`: Detailed explanation of what's wrong and why
- `confidence`: How certain you are about the diagnosis
- `suggestedApproach`: How to fix it (high-level)

### 5b: Update `report.md` — Append diagnosis context for the next LLM stage

Read the existing `report.md` (written by the reproduce skill). Append a new section with your full diagnosis findings. Include everything: the root cause, affected files with line numbers, detailed explanation of the code path, instrumentation results, and your suggested fix approach. This helps the fix skill work faster.

### 5c: Overwrite `comment.md` — Updated GitHub issue reply

Read the existing `report.md` to get the reproduction context. Write a new self-contained `comment.md` that incorporates both reproduction and diagnosis findings:

```markdown
## Automated Triage Report

**Status:** Reproduced — Root cause identified

**Cause:** [One sentence root cause]

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

[Full explanation of the root cause]

**Affected files:**
- `[file1:line]`
- `[file2:line]`

</details>

---
*This comment was generated by automated triage. A maintainer will review shortly.*
```

The comment must be **self-contained** — include the reproduction details from `report.md`, not just a reference to them.
