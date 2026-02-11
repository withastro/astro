# Reproduce

Reproduce a GitHub issue to determine if a bug is valid and reproducible.

**CRITICAL: You MUST always write `report.md` to the triage directory before finishing, regardless of outcome. Even if you encounter errors, cannot reproduce the bug, hit unexpected problems, or need to skip — always write `report.md`. The orchestrator and downstream skills depend on this file to determine what happened. If you finish without writing it, the entire pipeline fails silently.**

## Prerequisites

These variables are referenced throughout this skill. They may be passed as args by an orchestrator, or inferred from the conversation when run standalone.

- **`triageDir`** — Directory containing the reproduction project (e.g. `triage/issue-123`). If not passed as an arg, infer from previous conversation.
- **`issueDetails`** - The issue details, often a string of JSON containing the GitHub issue title, body, and comments. If not passed as an arg, infer the issue from previous conversation and run `gh issue view ${issue_number} --json title,body,comments` to load the issue details directly from GitHub.

## Overview

1. Confirm the issue details
2. Analyze the issue for early exit conditions (host-specific, unsupported version, etc.)
3. Set up a reproduction project in the triage directory
4. Attempt to reproduce the bug
5. Write `report.md` with detailed findings

## Step 1: Confirm Bug Details

Confirm that you have access to `bugDetails` (load directly from GitHub if you do not, following the instructions above).

**Otherwise**, fail — we cannot triage a bug that we have no details on.

Once you have `bugDetails`, read carefully:

- The bug description and expected vs actual behavior
- Any reproduction steps provided
- Environment details (Astro version from `astro info` output)
- Comments that might clarify the issue

## Step 2: Check for Early Exit Conditions

Before attempting reproduction, check if this issue should be skipped due to a limitation of our sandbox reproduction environment.

If any condition below is met, skip to Step 6 and write `report.md` with the skip details.

- **Not actionable** — Issue is not a bug report (this workflow can only act to triage bugs, cannot handle feature requests, suggestions, etc.). → skip reason: `not-actionable`
- **Unsupported version** — Astro 4.x or earlier (check `astro info` output or package.json). → skip reason: `unsupported-version`
- **Unsupported runtime** — Bug is specific to Bun or Deno. → skip reason: `unsupported-runtime`
- **Host-specific** — Bug is specific to Vercel, Netlify, Cloudflare, etc. (check for runtime adapter usage). → skip reason: `host-specific`
- **Maintainer override** — A maintainer commented that this issue cannot be reproduced here. Check status: `gh api "repos/<owner>/<repo>/collaborators/<user>" --silent && echo "user is collaborator"`. → skip reason: `maintainer-override`

## Step 3: Set Up Reproduction Project

The reproduction project goes in the `triageDir` directory (e.g. `triage/gh-123`). If no `triageDir` is provided, default to `triage/gh-<issue_number>`.

**If a StackBlitz URL is provided in the issue:**
The triage workspace has already been downloaded. Inspect what's there and proceed to configuration.

**If no StackBlitz URL (fallback to example template):**
The workspace has been set up from `examples/minimal`. You may need to add dependencies.

Sometimes, a user will provide a Gist URL instead of a StackBlitz URL to help show how to reproduce the issue. Use `gh gist view <gist-id>` to fetch any included gists, to help get a better understanding of what the problem is.

Check the issue to determine what's needed:

- React components → `pnpm astro add react` (in the triage dir)
- MDX content → `pnpm astro add mdx`
- Specific adapter → `pnpm astro add node` (or vercel, netlify, etc.)

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
