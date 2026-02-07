---
name: reproduce
description: Reproduce a GitHub issue for the Astro framework. Use when asked to "reproduce this issue", "reproduce this bug", or given a GitHub issue number/URL to investigate. Fetches the issue, creates a minimal reproduction in the monorepo triage/ directory, and determines whether the bug is reproducible.
---

# Reproduce Skill

Reproduce a GitHub issue to determine if a bug is valid and reproducible.

## Overview

1. Fetch the issue details using `gh` CLI
2. Analyze the issue for early exit conditions (host-specific, unsupported version, etc.)
3. Set up a reproduction project in the `triage/` directory
4. Attempt to reproduce the bug
5. Write structured output to `reproduction.json`

## Step 1: Fetch the Issue

```bash
gh issue view <issue_number> --repo withastro/astro --comments
```

Read carefully:
- The bug description and expected vs actual behavior
- Any reproduction steps provided
- Environment details (Astro version from `astro info` output)
- Comments that might clarify the issue

## Step 2: Check for Early Exit Conditions

Before attempting reproduction, check if this issue should be skipped:

**Unsupported Astro Version:**
- Astro 4.x or earlier → Write skip result and exit
- Look for version in `astro info` output or package.json mentions

**Host-Specific Issues:**
- Mentions Vercel, Netlify, Cloudflare, Deno Deploy deployment issues
- Uses `@astrojs/vercel`, `@astrojs/netlify`, `@astrojs/cloudflare` adapters
- Bug only occurs "in production" or "after deployment"
- → Write skip result with `skipReason: "host-specific"` and exit

**Runtime-Specific Issues:**
- Bug is specific to Bun or Deno (not Node.js)
- → Write skip result with `skipReason: "unsupported-runtime"` and exit

If any early exit condition is met, skip to Step 6 and write the appropriate skip result.

## Step 3: Set Up Reproduction Project

The reproduction project goes in `triage/<dir-name>/` where `<dir-name>` is provided or defaults to `gh-<issue_number>`.

**If a StackBlitz URL is provided in the issue:**
The triage workspace has already been downloaded. Inspect what's there and proceed to configuration.

**If no StackBlitz URL (fallback to example template):**
The workspace has been set up from `examples/minimal`. You may need to add dependencies.

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

Write your findings to `reproduction.json` in the triage directory:

```json
{
  "issueNumber": 12345,
  "reproducible": true,
  "skipped": false,
  "skipReason": null,
  "triageDir": "gh-12345-a1b2c3d4",
  "reproductionSource": "stackblitz",
  "astroVersion": "5.16.11",
  "errorMessage": "Cannot read properties of undefined (reading 'foo')",
  "stepsToReproduce": [
    "Create a page with a React component using client:only",
    "Run pnpm run build",
    "Build fails with the error above"
  ],
  "notes": "Reproduced on first attempt. The error occurs during SSR."
}
```

**Field definitions:**
- `reproducible`: `true`, `false`, or `"partial"` (sometimes reproduces)
- `skipped`: `true` if an early exit condition was met
- `skipReason`: `"host-specific"`, `"unsupported-version"`, `"unsupported-runtime"`, or `"no-repro-provided"`
- `reproductionSource`: `"stackblitz"`, `"example-template"`, or `"manual"`
- `astroVersion`: The version used for reproduction
- `errorMessage`: The main error message if any
- `stepsToReproduce`: Array of steps taken to reproduce
- `notes`: Any additional observations
