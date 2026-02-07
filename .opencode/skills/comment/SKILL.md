---
name: comment
description: Generate a GitHub issue comment summarizing triage findings. Use after the triage pipeline completes (at any stage). Reads report.md and any JSON output files to produce a comment.md ready to post.
---

# Comment Skill

Generate a GitHub issue comment from triage findings.

**CRITICAL: You MUST always write `comment.md` to the triage directory before finishing, regardless of what input files are available. Even if `report.md` and the JSON files are missing or empty, you must still produce a `comment.md`. In that case, write a minimal comment stating that automated triage could not be completed. The orchestrator depends on this file to post a GitHub comment.**

## Prerequisites

- The triage directory exists
- One or more of these files MAY exist (check for each, but don't fail if missing):
  - `report.md` — detailed internal report with full context
  - `reproduction.json` — structured reproduction data
  - `diagnosis.json` — structured diagnosis data
  - `fix.json` — structured fix data

## Overview

1. Read all available triage output files
2. Generate `comment.md` following the template below
3. Write to the triage directory

## Step 1: Read Triage Output

Read all available files from the triage directory. Some or all of these may not exist — that's OK, work with whatever is available:

- `report.md` — detailed internal report with full context
- `reproduction.json` — structured reproduction data
- `diagnosis.json` — structured diagnosis data (may not exist)
- `fix.json` — structured fix data (may not exist)

If none of these files exist, generate a minimal comment (see "Fallback" section below).

## Step 2: Generate Comment

Write `comment.md` following this template. Adapt it to fit the findings:

- Include only the sections that are relevant to what was discovered
- If the issue could NOT be reproduced, omit the fix-related sections
- If no fix was developed, omit the "How to Fix" section or replace its content with a brief note explaining why
- Add or remove subsections as needed to clearly communicate findings

Keep it concise:
- Summary section: One sentence per bold field
- Use collapsible `<details>` sections for longer content
- Include exact versions, commands, and file paths where relevant

Format requirements:
- Code blocks: Use appropriate language hints (bash, typescript, diff, patch, etc.)
- Patches: Use ```diff for maintainer patches

### Template

```markdown
## Summary

**[I was able to reproduce this issue. / I was unable to reproduce this issue. / This issue was not triaged automatically.]** [1-2 sentences describing the result and key observations.]

**Cause:** [Single sentence explaining the root cause - or just the word "Unknown" if not determined.]

**Impact:** [Single sentence describing who is affected and how - or just the word "Unknown" if not determined.]

**Fix:** [Single sentence summarizing the solution - or just the word "Unknown" if no fix determined.]

---

<details>
<summary><strong>Reproduction Details</strong></summary>

### Environment
- **[Package Name]:** [version]
- **Node.js:** [version]
- **Package Manager:** [npm/pnpm/yarn]

### Steps to Reproduce
1. [First step]
2. [Next step]

### Expected Result
[What should happen]

### Actual Result
[What actually happens, including error messages if applicable]

</details>

<details>
<summary><strong>How to Fix (Maintainers)</strong></summary>

### Root Cause Analysis

[Explanation of the root cause, which files are involved, and why the current behavior is incorrect.]

### Solution

[Description of the fix and why it works.]

### Git Patch

Apply this patch to the `[org/repo]` repository:

```diff
[INSERT GIT DIFF]
```

### Alternative Approaches
[Other approaches considered and their tradeoffs]

### Testing
[How to test that the fix is working correctly]

</details>

*This report was made by an LLM. Mistakes happen, check important info.*
```

## Step 3: Write Output

Write the comment to `triage/<dir>/comment.md`.

The comment should be:
- **Concise** — respect the reader's time
- **Actionable** — clear next steps for maintainers
- **Friendly** — remember the issue author is trying to help
- **Accurate** — only state what was actually observed

### Fallback

If no triage output files exist at all (no `report.md`, no JSON files), write this minimal `comment.md`:

```markdown
## Summary

**This issue was not triaged automatically.** The automated triage pipeline was unable to complete analysis for this issue.

**Cause:** Unknown

**Impact:** Unknown

**Fix:** Unknown

*This report was made by an LLM. Mistakes happen, check important info.*
```
