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
- `Testing` explains how behavior was validated.
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

- <What scenarios were validated and why this proves the behavior>
- <Key test file/test name where applicable>

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

Explain validation quality.

Include:

- scenarios validated (happy path, failure path, regression)
- why those checks prove correctness
- key test references

Do not include:

- command transcript lists

### Docs

Explain docs impact clearly.

- If docs are not needed, say why in one sentence.
- If docs are needed, link the docs PR.

## Brevity Guidance

- Keep simple PRs short (1-2 bullets per section can be enough).
- Add detail only when it helps reviewer understanding.
- Avoid repeating the same point across sections.

## Self-Check Before Posting

- Title is reviewer-friendly (not commit-style)
- `Changes` bullets describe behavior/implementation/impact
- `Testing` explains scenarios and outcomes, not shell commands
- `Docs` decision is explicit
