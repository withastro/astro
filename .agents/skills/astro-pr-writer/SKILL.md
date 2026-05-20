---
name: astro-pr-writer
description: Write and update Astro pull requests with reviewer-friendly titles and high-signal bodies. Trigger whenever the user asks to create a PR, open a PR, draft a PR, update PR title/body, or write PR notes/summary/description.
---

# Astro PR Writer

Write Astro pull request descriptions that help reviewers quickly understand intent, behavior changes, and validation.

Use this skill whenever the user asks for any PR-writing task, including:

- create/open a pull request
- create/open a draft pull request
- update a PR title
- update a PR body/description
- write PR notes/summary

## Core Principle

Describe the **change**, **how it works**, and **why it matters**.

- `Changes` explains what the fix/feature does.
- `Testing` lists what test code was added or changed.
- `Docs` explains whether user-facing docs changes are needed.

Do not use PR sections as a task log.

## PR Title Rules

Use a human, reviewer-friendly title.

- Describe the outcome in plain language.
- Keep it concise and specific.
- Prefer phrasing a person would naturally write in a review queue.

Do not use:

- conventional commit prefixes in PR titles (`fix:`, `feat:`, `docs:`, etc.)
- scoped commit-style titles (`fix(cloudflare): ...`)

## Body Rules

Use this structure:

```md
## Changes

- <Behavior change and why it matters>
- <Implementation detail and impact>

## Testing

- <New or changed test and what it covers>
- <Why an existing assertion changed>

## Docs

- <No docs update needed, because ...>
```

### Changes

Focus on behavior, implementation approach, and impact.

Include:

- what now works that did not work before
- how the fix/feature works (reviewer-useful level)
- user-facing reliability/compatibility/perf behavior changes

Do not include:

- "added test" or "updated fixture" (belongs in `Testing`)
- "added changeset"
- internal process notes with no behavior impact

### Testing

List what test code was added or changed, and why. Reviewers read this section to understand test coverage changes — not to hear that you ran a test suite.

Include:

- new test files or test cases added, with a short description of what they cover
- existing tests that were updated, and why the assertion changed

Do not include:

- that tests pass (CI shows this; it's noise)
- which commands you ran
- how many tests passed

### Docs

Explain docs impact clearly.

- If docs are not needed, say why in one sentence.
- If docs are needed, link the docs PR.

## Brevity Guidance

Default to short. 1-2 bullets per section is normal — add more only when the change is genuinely complex. A reviewer scanning a PR queue should be able to read the whole body in under 30 seconds for a typical patch.

**Too verbose:**

> - Moves `.optional().prefault({})` outside `z.preprocess()` for the `server` config property in both `base.ts` and `relative.ts`, matching the `integrations` fix from #16531. Zod 4.4.0 rejects missing properties wrapped in `z.preprocess()` before the preprocessor or inner defaults can execute — moving `.optional().prefault({})` outside the preprocess call resolves this. Fixes the `server` property issue reported there by @rururux.
> - Adds `invalid_key`, `invalid_element`, and discriminated union `options` handlers to both Astro and DB error maps for Zod 4.4.0 compatibility. Zod 4.4.0 surfaces record key refinement failures (e.g. env schema variable names) as structured `invalid_key` issues with nested errors instead of a flat message. The handlers extract the actual refinement message for clear user-facing errors.
> - All changes are backward-compatible with Zod 4.3.x. New error map branches only activate on issue codes that 4.4.0 starts emitting.

**Better:**

> - Moves `.optional().prefault({})` outside `z.preprocess()` for the `server` config, matching the `integrations` fix from #16531. Fixes the issue reported there by @rururux.
> - Adds `invalid_key`, `invalid_element`, and discriminated union `options` handlers to both error maps for Zod 4.4.0 compat.
> - Backward-compatible with Zod 4.3.x.

## Changesets

Every PR that modifies a package requires a changeset. Only `examples/*` changes are exempt.

Load the `changeset` skill to create the changeset file and write the message. It covers file creation, format, bump types, and message conventions.

When writing the PR body:

- Always check that a changeset exists before posting the PR
- Do not mention "added changeset" in the `Changes` section — it is process noise, not a behavior change

## Self-Check Before Posting

- Title is reviewer-friendly (not commit-style)
- `Changes` bullets describe behavior/implementation/impact
- `Testing` lists test code added/changed, not test run results
- `Docs` decision is explicit
- Changeset file exists in `.changeset/` for any package-modifying PR
