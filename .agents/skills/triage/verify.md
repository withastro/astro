# Verify

Verify whether a GitHub issue describes an actual bug or a misunderstanding of intended behavior.

**CRITICAL: You MUST always read `report.md` and append to `report.md` before finishing, regardless of outcome. Even if you cannot reach a conclusion — always update `report.md` with your findings. The orchestrator and downstream skills depend on this file to determine what happened.**

**SCOPE: Your job is verification only. Finish your work once you've completed this workflow. Do NOT go further than this (no fixing of the issue, etc.).**

## Prerequisites

These variables are referenced throughout this skill. They may be passed as args by an orchestrator, or inferred from the conversation when run standalone.

- **`triageDir`** — Directory containing the reproduction project (e.g. `triage/issue-123`). If not passed as an arg, infer from previous conversation.
- **`issueDetails`** - The GitHub API issue details payload. This must be provided explicitly by the user or available from prior conversation context / tool calls. If this data isn't available, you may run `gh issue view ${issue_number}` to load the missing issue details directly from GitHub.
- **`report.md`** — File in `triageDir` that MAY exist. Contains the full context from all previous skills.
- **Astro Compiler source** — The `withastro/compiler` repo MAY be cloned at `.compiler/` (inside the repo root, gitignored). If it exists, treat it as in-scope when researching intent. Some behaviors originate in the compiler — check `.compiler/` for comments, explicit handling, and git blame when the issue involves HTML parsing, `.astro` file transformation, or compiler output.

## Overview

1. Review the issue and any existing reproduction findings
2. Identify the claim: what does the reporter say _should_ happen?
3. Research whether the current behavior is intentional (docs, source code, git blame, GitHub issues/PRs)
4. Assess the verdict: bug, intended behavior, or unclear
5. Assign confidence
6. Append verification findings to `report.md`

## Step 1: Identify the Claim

Read the issue (from `report.md` or directly from GitHub) and extract two things:

- **Current behavior**: What the reporter observes happening.
- **Expected behavior**: What the reporter says _should_ happen instead.

The expected behavior is the claim you are verifying. Your job is to determine whether it is correct (a real bug) or a misunderstanding of how Astro is designed to work.

## Step 2: Research Intended Behavior

Investigate whether the current behavior is intentional. Use multiple sources, and **do not assume the reporter is correct**. The reporter may be wrong about what Astro should do.

### 2a: Check the documentation

Search the Astro docs for relevant pages. Does the documentation describe or imply the current behavior? Does it promise the behavior the reporter expects?

### 2b: Check the source code for intent signals

Look at the relevant source code in `packages/`. Pay close attention to:

- **Comments explaining "why"** — If a developer left a comment explaining why the code works a certain way, that is strong evidence of intentional design. Treat these comments as authoritative unless they are clearly outdated.
- **Explicit conditionals and early returns** — Code that explicitly checks for the reported scenario and handles it differently than the reporter expects is likely intentional.
- **Named constants and configuration** — Behavior controlled by a named config option or constant was probably a deliberate choice.

### 2c: Git blame on key lines

If `report.md` identifies specific files and line numbers, run `git blame` on the relevant lines to find the commit that introduced the behavior. Then read the full commit message with `git show --no-patch <commit>` and review the associated PR if referenced. You can fetch PR details with `gh pr view <number>`. A commit message, PR description, or PR comment from the author explaining the rationale is strong evidence of intentional design.

### 2d: Search prior GitHub issues and PRs

Search for prior issues and PRs that discuss the same behavior using the GitHub API. This can reveal whether the behavior was previously discussed, intentionally introduced, or already reported and closed as "not a bug."

```bash
# Search issues for keywords related to the reported behavior
gh search issues "<keywords>"
# Search PRs that may have introduced or discussed the behavior
gh search prs "<keywords>"
# Read a specific issue for context
gh issue view <number> --comments
# Read a specific PR for context
gh pr view <number> --comments
```

If you find a closed issue where a maintainer explained why the behavior is intentional, or a PR that deliberately introduced it, that is strong evidence of intended behavior.

### 2e: Distinguish bugs from non-bugs

This is the most important and most error-prone step. For triage purposes, the definitions are:

- A **bug** is when the code does something the developer **did not know about or did not choose**. The behavior is accidental — a regression, an oversight, an unhandled edge case that was never considered.
- A **non-bug** (intended behavior / enhancement request) is when the developer **was aware of the behavior and consciously chose to ship it that way** — even if the behavior is imperfect, even if the developer wishes it were better, and even if the reporter's complaint is legitimate.

The key question is not "does the developer _like_ this behavior?" but rather "did the developer _know about_ and _choose_ this behavior?" If the answer is yes, it is not a bug — it is a known limitation, a trade-off, or a deliberate design choice. The reporter may have a valid request to improve it, but that is an enhancement, not a bug fix.

Ask yourself:

- **Is there a comment explaining this behavior?** If a developer wrote a comment like "we can't do X because Y" or "in SSR we skip this because...", that means the developer was aware of the limitation and chose to ship it. That is not a bug — it is a known limitation. This is true even if the comment frames it as something they _couldn't_ solve rather than something they _chose_ not to solve. Shipping with awareness of a gap is a conscious decision.
- **Does the code have an explicit check for this case?** If the code specifically handles the reported scenario (e.g., an `if` branch, a special case, a guard clause), the behavior is likely intentional.
- **Would "fixing" this introduce correctness risks?** If the current behavior is the conservative/safe option and the reporter's expected behavior would risk breaking other cases, the current behavior is likely a deliberate trade-off.
- **Is the reporter's expectation documented anywhere?** If neither the docs nor the code promise the behavior the reporter expects, the expectation may simply be wrong.

**Common mistakes to avoid:**

- Do not treat a known limitation as a bug. If a developer wrote "we can't do X here because Y" and skipped that case, the resulting behavior is a **known limitation**, not a bug — even though the developer would prefer to support that case. The reporter's request to close the gap is an enhancement request.
- Do not treat a design trade-off as a bug just because the reporter frames it as one. If the code intentionally does X (with a comment explaining why), and the reporter wants Y, the correct verdict is "intended behavior / feature request" — even if Y seems like a reasonable thing to want.
- Do not conflate "imperfect" with "broken." A feature that works for some cases but not others (with the gap documented in code) is incomplete, not buggy. Incomplete features are enhanced, not fixed.

## Step 3: Assess the Verdict

Based on your research, assign one of three verdicts:

### Verdict: Bug

The developer was **not aware** of this behavior, or did **not choose** it. Evidence:

- The code lacks any comment or rationale for the behavior
- The behavior contradicts documentation
- The behavior is clearly a regression (worked before, broke after a change)
- No explicit handling exists for this case — it falls through by accident
- The scenario was never considered (no guard, no comment, no test)

### Verdict: Intended Behavior / Enhancement Request

The developer **was aware** of this behavior and **chose to ship it**. Evidence:

- A code comment explains the limitation or trade-off (e.g., "we can't do X because Y", "in SSR we skip this because...")
- A known limitation was explicitly left as a gap, with awareness documented in code or a commit message
- An explicit conditional handles this case by design
- A commit message or PR description explains the rationale
- A prior GitHub issue was closed as "not a bug" or "by design" for this same behavior
- "Fixing" it would introduce correctness or safety risks

Note: This verdict does not mean the reporter's concern is invalid. It may still be worth improving the behavior — but that is a **feature request or enhancement**, not a bug fix. A known limitation is an enhancement opportunity, not a defect.

### Verdict: Unclear

You cannot confidently determine intent. This might happen when:

- The code has no comments and the intent is ambiguous
- The behavior could be either intentional or accidental
- Documentation is silent on this specific case

When unclear, lean toward "unclear" rather than guessing. It is better to flag uncertainty than to misclassify.

## Step 4: Assign Confidence

Rate your confidence as:

- **high** — Strong evidence supports the verdict (explicit comments, clear docs, unambiguous code, prior maintainer statements in GitHub issues/PRs)
- **medium** — Reasonable evidence but some ambiguity remains
- **low** — Mostly inference; could go either way

## Step 5: Write Output

Append your verification findings to `report.md`.

Include a new section with:

- The reporter's claim (expected behavior)
- Your verdict: `bug`, `intended-behavior`, or `unclear`
- Your confidence in your verdict: `high`, `medium`, or `low`
- Evidence supporting your verdict (specific code comments, doc references, commit messages, prior issues/PRs, etc.)
- If the verdict is `intended-behavior`: explain the design rationale and note that the reporter's concern could be reframed as a feature request or enhancement
- If the verdict is `bug`: explain why the developer was not aware of or did not choose this behavior
- If the verdict is `unclear`: explain what evidence is missing and what would resolve the ambiguity
