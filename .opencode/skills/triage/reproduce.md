# Reproduce

Reproduce a GitHub issue to determine if a bug is valid and reproducible.

**CRITICAL: You MUST always write `report.md` to the triage directory before finishing, regardless of outcome. Even if you encounter errors, cannot reproduce the bug, hit unexpected problems, or need to skip — always write `report.md`. The orchestrator and downstream skills depend on this file to determine what happened. If you finish without writing it, the entire pipeline fails silently.**

## Overview

1. Get the issue details
2. Analyze the issue for early exit conditions (host-specific, unsupported version, etc.)
3. Set up a reproduction project in the triage directory
4. Attempt to reproduce the bug
5. Write `report.md` with detailed findings

## Step 1: Get the Bug Report

**If `issueTitle` and `issueBody` are provided in args**, use those as the bug report directly.

**If a GitHub issue number or URL is mentioned** (but no `issueTitle`/`issueBody`), fetch it with the `gh` CLI:
```bash
gh issue view <issue_number> --comments
```

**Otherwise**, fail — there is not enough information to reproduce a bug.

Read carefully:
- The bug description and expected vs actual behavior
- Any reproduction steps provided
- Environment details (Astro version from `astro info` output)
- Comments that might clarify the issue

## Step 2: Check for Early Exit Conditions

Before attempting reproduction, check if this issue should be skipped:

**Unsupported Astro Version:**
- Astro 4.x or earlier → Write `report.md` noting the skip and exit
- Look for version in `astro info` output or package.json mentions

**Host-Specific Issues:**
- Mentions Vercel, Netlify, Cloudflare, Deno Deploy deployment issues
- Uses `@astrojs/vercel`, `@astrojs/netlify`, `@astrojs/cloudflare` adapters
- Bug only occurs "in production" or "after deployment"
- → Write `report.md` noting the skip reason ("host-specific") and exit

**Runtime-Specific Issues:**
- Bug is specific to Bun or Deno (not Node.js)
- → Write `report.md` noting the skip reason ("unsupported-runtime") and exit

If any early exit condition is met, skip to Step 6 and write `report.md` with the skip details.

## Step 3: Set Up Reproduction Project

The reproduction project goes in the `triageDir` directory provided in args (e.g. `triage/gh-123`). If no `triageDir` is provided, default to `triage/gh-<issue_number>`.

**If a StackBlitz URL is provided in the issue:**
The triage workspace has already been downloaded. Inspect what's there and proceed to configuration.

**If no StackBlitz URL (fallback to example template):**
The workspace has been set up from `examples/minimal`. You may need to add dependencies.

Sometimes, a user will provide a Gist URL instead of a StackBlitz URL to help show how to reproduce the issue. Use `gh gist view <gist-id>` to fetch any included gists, to help get a better understanding of what the problem is.

Check the issue to determine what's needed:
- React components → `pnpm astro add react` (in the triage dir)
- MDX content → `pnpm astro add mdx`
- Specific adapter → `pnpm astro add node` (or vercel, netlify, etc.)

See [references/monorepo-setup.md](references/monorepo-setup.md) for details on working with the triage workspace.

## Step 4: Configure the Project

Based on the issue, modify the triage project:

1. Update `astro.config.mjs` with required configuration
2. Create pages, components, or middleware that trigger the bug
3. Add any additional files mentioned in the issue

Keep the reproduction as minimal as possible — only add what's needed to trigger the bug.

## Step 5: Attempt Reproduction

Run commands to reproduce the issue:

```bash
# For build-time issues
pnpm run build

# For dev server issues
pnpm run dev
# Then use agent-browser to test: npx agent-browser http://localhost:4321/path

# For preview issues
pnpm run build && pnpm run preview
```

Test both:
1. **The broken case** — follow the steps to trigger the bug
2. **The working case** — verify the project works normally before the breaking change

Document what you observe:
- Exact error messages and stack traces
- Which command triggers the issue
- Whether the issue is consistent or intermittent

## Step 6: Write Output

Write `report.md` to the triage directory:

### `report.md` — Detailed internal report for the next LLM stage

Write a verbose report with everything you learned. This is NOT for humans — it's context for the next stage of the pipeline (diagnose/fix). **Downstream skills will NOT have access to the original issue — `report.md` is their only source of context.** Include:
- The original issue title, description, and any relevant details from the issue body. It's better to include too much context from the original issue vs. too little. You never know what information will be useful to future steps in the workflow, like while trying to find the fix in the codebase.
- Full environment details
- All steps attempted and their results
- Complete error messages and stack traces
- Observations about the codebase, theories about root cause
- Anything that would help the next stage work faster

Be thorough. More context is better here.

The report must include all information needed for a final GitHub comment to be generated later by the comment skill. Make sure to include:
- Environment details (package versions, Node.js version, package manager)
- Steps to reproduce (numbered list)
- Expected vs actual result
- Error messages and stack traces
- Whether the issue was reproduced, not reproduced, or skipped (and why)
