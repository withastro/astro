# Reproduce

Reproduce a GitHub issue to determine if a bug is valid and reproducible.

**CRITICAL: You MUST always read `report.md` and write `report.md` to the triage directory before finishing, regardless of outcome. Even if you encounter errors, cannot reproduce the bug, hit unexpected problems, or need to skip — always write `report.md`. The orchestrator and downstream skills depend on this file to determine what happened. If you finish without writing it, the entire pipeline fails silently.**

**SCOPE: Your job is reproduction only. Finish your work once you've completed this workflow. Do NOT go further than this (no larger diagnosis of the issue, no fixing of the issue, etc.).**

## Prerequisites

These variables are referenced throughout this skill. They may be passed as args by an orchestrator, or inferred from the conversation when run standalone.

- **`triageDir`** — Directory containing the reproduction project (e.g. `triage/issue-123`). If not passed as an arg, infer from previous conversation.
- **`issueDetails`** - The GitHub API issue details payload. This must be provided explicitly by the user or available from prior conversation context / tool calls. If this data isn't available, you may run `gh issue view ${issue_number}` to load the missing issue details directly from GitHub.

## Overview

1. Confirm the issue details
2. Analyze the issue for early exit conditions (host-specific, unsupported version, etc.)
3. Set up a reproduction project in the triage directory
4. Attempt to reproduce the bug
5. Write `report.md` with detailed findings

## Step 1: Confirm Bug Details

Confirm that you have `issueDetails` as defined/instructed above. **Otherwise**, fail — we cannot triage a bug that we have no details on.

Once you have `issueDetails`, read carefully:

- The bug description and expected vs actual behavior
- Any reproduction steps provided
- Environment details (Astro version from `astro info` output)
- Comments that might clarify the issue

## Step 2: Check for Early Exit Conditions

Before attempting reproduction, check if this issue should be skipped due to a limitation of our sandbox reproduction environment.

If any early exit condition is met, skip to Step 5 and write `report.md` with the skip details.

**Comment Handling for Early Exits:** Sometimes future comments will provide additional reproductions. An early exit is only valid if not future comments in that issue "invalidate" it. For example, if the original poster of a bug was on Astro 3.0, we would exit initially (`unsupported-version`). However, on a future run, if a commenter had later posted a similar reproduction but on the latest version of Astro, we would no longer consider that a valid early exit, and would instead continue on with the workflow.

The following are the documented early exit conditions that we support:

### Not Actionable (`not-actionable`)

Skip if the issue is not a bug report. This workflow can only triage bugs — feature requests, suggestions, and discussions are not actionable here.

### Missing Details (`missing-details`)

Skip if the issue is missing a valid reproduction (see below for list of supported valid reproductions).
Skip if the issue is missing a description of the user's expected result (ex: "What's the expected result?" section of our issue template is filled out).
We need both of these to successfully reproduce, and later to verify the expected results.

### Unsupported Astro Version (`unsupported-version`)

Skip if the bug targets Astro 4.x or earlier. Look for version in `astro info` output or package.json mentions.

### Host-Specific Issues (`host-specific`)

Skip if the bug can only be reproduced on a specific hosting platform (Vercel, Netlify, Cloudflare, Deno Deploy, etc.). Signs to look for:

- Issue references a host-specific adapter (`@astrojs/vercel`, `@astrojs/netlify`, `@astrojs/cloudflare`)
- Bug only occurs "in production" or "after deployment" but specifically not reproducible in dev and local preview builds

### Runtime-Specific Issues (`unsupported-runtime`)

Skip if the bug is specific to Bun or Deno. Our sandbox only supports Node.js.

### Maintainer Override (`maintainer-override`)

Skip if a repository maintainer has commented that this issue should not be reproduced here. To determine if a commenter is a maintainer, check the `authorAssociation` field on their comment in `issueDetails` — values of `MEMBER`, `COLLABORATOR`, or `OWNER` indicate a maintainer.

## Step 3: Set Up Reproduction Project

Every bug report should include some sort of reproduction. The reproduction project goes in the `triageDir` directory (e.g. `triage/gh-123`). If no `triageDir` is provided, default to `triage/gh-<issue_number>`.

Set up the reproduction project based on what the issue provides you. Once the reproduction project directory has been completed, run `pnpm install --no-frozen-lockfile` in the workspace top-level root to connect it to the rest of the monorepo.

### StackBlitz Project URL (`https://stackblitz.com/edit/...`)

If reproduction was provided as a Stackblitz project URL, download it into the `triageDir` directory using `stackblitz-clone`:

```bash
npx stackblitz-clone@latest <stackblitz-url> <triageDir>
```

### StackBlitz GitHub URL (`https://stackblitz.com/github/...`)

StackBlitz has a special, commonly-used URL to open a GitHub repo in StackBlitz. If we have received one of these as reproduction, parse out the GitHub org & repo names and then treat it as a GitHub URL, following the "GitHub URL" step below.

### GitHub URL (`https://github.com/...`)

If reproduction was provided as a GitHub repo URL, clone the repo into the triage directory and remove the `.git` directory to avoid conflicts with the host repo:

```bash
git clone https://github.com/<owner>/<repo>.git <triageDir>
rm -rf <triageDir>/.git
```

If a specific branch or subdirectory is referenced, check out that branch before removing `.git`, or copy only the relevant subdirectory.

### Gist URL (`https://gist.github.com/`)

Fetch the gist contents using the GitHub API to help understand the reproduction:

```bash
curl -s "https://api.github.com/gists/<gist-id>"
```

You may still need to set up a project from scratch (see fallback below) and apply the gist files into it.

### Manual Steps Reproduction

If no reproduction URL is provided, you will need to follow the manual steps that the user provided instead. If the user didn't mention a specific template, use `minimal` as the default.

```bash
# 1. List available example templates
ls examples/
# 2. Remove the selected template's node_modules directory to avoid problems with `cp -r`
rm -rf examples/<template>/node_modules
# 3. Copy over the selected template into the triage directory
cp -r examples/<template> <triageDir>
# 4. Re-run install (at the workspace root) to add back missing node_modules dependencies
pnpm install --no-frozen-lockfile
```

Verify that the project was created in the correct place (`cat <triageDir>/package.json`).

Then, modify the triage project as needed to attempt your reproduction:

1. Update `astro.config.mjs` with required configuration changes
2. Add/modify any dependencies or Astro integrations (`@astrojs/react`, etc.)
3. Add/modify any pages, components, middleware, etc. that trigger the bug
4. Add/modify any additional files mentioned in the issue

Keep the reproduction as minimal as possible — only add what the issue reporter has documented as needed to trigger the bug.

## Step 4: Attempt Reproduction in the Triage Project

Use all of the tools at your disposal — `pnpm run dev|build|preview|test`, `curl`, `agent-browser`, etc.

1. **Trigger the bug.** Follow the reproduction steps from the issue and confirm that the bug appears.
2. **Verify the baseline.** Remove or reverse the triggering code and confirm the project works without the bug. This guards against false positives — if the project is still broken without the triggering code, the issue may be in your setup, not the reported bug.
3. **Document what you observe.** Record exact error messages and stack traces, which command triggers the issue, and whether it's consistent or intermittent.

## Step 5: Write Output

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
