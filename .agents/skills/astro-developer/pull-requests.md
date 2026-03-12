# Pull Request Guide

How to write Astro pull request descriptions that help reviewers quickly understand intent, behavior changes, and validation.

## Core Principle

Describe the **change**, **how it works**, and **why it matters**.

- `Changes` explains what the fix/feature does.
- `Testing` explains how the behavior was validated.
- `Docs` explains whether user-facing docs changes are needed.

Do not use PR sections as a task log.

## Section-by-Section Rules

### Changes

Use this section for the core code change: behavior, implementation approach, and impact.

Good content:

- What now works that did not work before
- How the fix/feature works (at a reviewer-useful level)
- What errors/messages/outputs changed
- What reliability/performance/compatibility behavior changed

Do not include:

- "Added test" or "updated fixture" (belongs in `Testing`)
- "Added changeset" (baseline required and CI-enforced; not useful PR context)
- Internal process notes that do not change behavior

### Testing

Use this section to explain validation quality.

Include:

- What scenarios were tested (happy path, failure path, regression)
- Why those checks prove the change works
- The key test file and test name where applicable

Do not include:

- Lists of shell commands used during development

### Docs

Explain docs impact based on user-facing behavior.

- If docs are not needed, briefly explain why (for example: internal bug fix, no docs-facing behavior change).
- If docs are needed, link the associated docs PR.

## PR Template (Recommended)

```md
## Changes

- <Behavior change 1 and why it matters>
- <Behavior change 2 and why it matters>

## Testing

- Validated <scenario A> and <scenario B> to confirm <expected behavior>.
- Added/updated coverage in `<path/to/test-file>` (`<test name>`), which reproduces the original failure and verifies the fix.

## Docs

- <No docs update needed, because ...>
- <OR: Docs update in <docs PR link>>
```

## Bad vs Good

### Bad

```md
## Changes

- Fixed prerenderer error details
- Added a test for the issue
- Added changesets

## Testing

- pnpm -C packages/astro build
- pnpm -C packages/integrations/cloudflare exec astro-scripts test test/prerenderer-errors.test.js
```

Why this is bad:

- Mixes behavior changes with process chores (`Added a test`, `Added changesets`)
- `Testing` is command-only and does not explain validation intent

### Good

```md
## Changes

- Surface Cloudflare prerenderer response body details in build errors for missing `getStaticPaths()` and static image collection failures, so workerd-originated failures are actionable.
- Ensure prerenderer teardown runs in a `finally` path during build generation, so cleanup still happens when prerendering throws.

## Testing

- Reproduced the Cloudflare prerender failure with a dynamic route missing `getStaticPaths()` and verified the thrown error now includes workerd response details.
- Added regression coverage in `packages/integrations/cloudflare/test/prerenderer-errors.test.js` (`surfaces prerenderer body details for missing getStaticPaths`) to lock in the message quality improvement.

## Docs

- No docs update needed; this changes internal error reporting quality and teardown reliability.
```

## Self-Check Before Posting

- Every `Changes` bullet describes behavior/implementation/impact (not a task log)
- `Testing` explains scenarios and expected outcomes, with no shell command lists
- At least one concrete test reference is included when tests were added/changed
- No mention of routine changesets unless there is an unusual release-related reason
- `Docs` decision is explicit; link docs PR when docs updates are required
