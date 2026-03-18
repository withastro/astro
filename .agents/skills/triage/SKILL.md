---
name: triage
description: Triage a bug report. Reproduces the bug, diagnoses the root cause, verifies whether the behavior is intentional, and attempts a fix. Use when asked to "triage issue #1234", "triage this bug", or similar.
---

# Triage

Triage a bug report end-to-end: reproduce the bug, diagnose the root cause, verify whether the behavior is intentional, and attempt a fix.

## Input

You need either:

- `issueTitle` and `issueBody` provided in args (preferred — use these directly as the bug report), OR
- A GitHub issue number or URL mentioned in the conversation (use `gh issue view` to fetch details)

If a `triageDir` is provided in args, use that as the working directory for the triage. Otherwise, default to `triage/gh-<issue_number>` (if you have an issue number) or `triage/current`.

## Step 1: Reproduce

Read and follow [reproduce.md](reproduce.md). Use a subagent for this step to isolate context.

After completing reproduction, check the result:

- If the issue was **skipped** (host-specific, unsupported version, etc.) — skip to Output.
- If the issue was **not reproducible** — skip to Output.
- If the issue was **reproduced** — continue to Step 2.

## Step 2: Diagnose

Read and follow [diagnose.md](diagnose.md). Use a subagent for this step to isolate context.

After completing diagnosis, check your confidence:

- If confidence is **low** — skip to Output.
- If confidence is **medium** or **high** — continue to Step 3.

## Step 3: Verify

Read and follow [verify.md](verify.md). Use a subagent for this step to isolate context.

After completing verification, check the verdict:

- If the verdict is **intended-behavior** — skip to Output. The issue is not a bug; do not attempt a fix.
- If the verdict is **bug** or **unclear** — continue to Step 4.

## Step 4: Fix

Read and follow [fix.md](fix.md). Use a subagent for this step to isolate context.

Whether the fix succeeds or fails, continue to Output.

## Output

After completing the triage (or exiting early), you may suggest generating a GitHub comment using [comment.md](comment.md) if the user would find it useful.
