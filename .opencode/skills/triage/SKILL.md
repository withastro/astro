---
name: triage
description: Triage a GitHub issue for the Astro framework. Reproduces the bug, diagnoses the root cause, attempts a fix, and generates a summary comment. Use when asked to "triage issue #1234", "triage this bug", or similar.
---

# Triage

Triage a GitHub issue end-to-end: reproduce the bug, diagnose the root cause, attempt a fix, and generate a summary comment.

## Input

You need either:
- `issueTitle` and `issueBody` provided in args, OR
- A GitHub issue number or URL mentioned in the conversation

If a `triageDir` is provided in args, use that as the working directory for the triage. Otherwise, default to `triage/gh-<issue_number>`.

## Step 1: Reproduce

Read and follow [reproduce.md](reproduce.md).

After completing reproduction, check the result:
- If the issue was **skipped** (host-specific, unsupported version, etc.) — skip to Step 4 to generate a comment explaining why.
- If the issue was **not reproducible** — skip to Step 4 to generate a comment with your findings.
- If the issue was **reproduced** — continue to Step 2.

## Step 2: Diagnose

Read and follow [diagnose.md](diagnose.md).

After completing diagnosis, check your confidence:
- If confidence is **low** — skip to Step 4 to generate a comment with what you found so far.
- If confidence is **medium** or **high** — continue to Step 3.

## Step 3: Fix

Read and follow [fix.md](fix.md).

Whether the fix succeeds or fails, continue to Step 4.

## Step 4: Generate Comment

Read and follow [comment.md](comment.md).
