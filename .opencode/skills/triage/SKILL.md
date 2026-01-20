---
name: triage
description: Triage GitHub issues for the Astro framework. Use when asked to "triage this issue", "reproduce this bug", or given a GitHub issue number/URL to investigate. Fetches the issue, attempts reproduction, optionally develops a fix, and generates a structured report.
---

# Astro Issue Triage

This skill guides you through triaging GitHub issues for the `withastro/astro` repository. The workflow has three phases:

1. **Triage** - Fetch and analyze the issue, attempt reproduction
2. **Fix** (optional) - If reproducible, attempt to develop a fix
3. **Report** - Generate a structured report of findings

## Quick Start

When given a GitHub issue number or URL:

1. Load and follow [TRIAGE.md](TRIAGE.md) to fetch the issue and attempt reproduction
2. If reproduction succeeds and a fix is requested, follow [FIX.md](FIX.md)
3. Generate a final report following [REPORT.md](REPORT.md)

## Input Formats

The user may provide:
- An issue number: `#12345` or `12345`
- An issue URL: `https://github.com/withastro/astro/issues/12345`

Extract the issue number and use the `gh` CLI to fetch issue details.

## Important Notes

- Always use Node.js and npm (not bun, yarn, or pnpm)
- Use `npm create astro` to create test projects for reproduction
- The Astro source code is in this repository under `packages/`
- For Astro 6 issues, use `--ref next` with `npm create astro`
- For Astro 5 issues, do not use `--ref next`
- Astro 4 and earlier are not supported - exit early if the issue is for an older version
