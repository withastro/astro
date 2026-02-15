# Comment

Generate a GitHub issue comment from triage findings.

**CRITICAL: You MUST always read `report.md` and produce a GitHub comment as your final output, regardless of what input files are available. Even if `report.md` is missing or empty, you must still produce a comment. In that case, produce a minimal comment stating that automated triage could not be completed.**

## Prerequisites

These variables are referenced throughout this skill. They may be passed as args by an orchestrator, or inferred from the conversation when run standalone.

- **`triageDir`** — Directory containing the reproduction project (e.g. `triage/issue-123`). If not passed as an arg, infer from previous conversation.
- **`report.md`** — File in `triageDir` that MAY exist. Contains the full context from all previous skills (reproduction, diagnosis, fix).
- **`branchName`** — The branch name where a fix was pushed. If not passed as an arg, infer from previous conversation.

## Overview

1. Read `report.md` from the triage directory
2. Generate a GitHub comment following the template below

## Step 1: Read Triage Output

Read `report.md` from the `triageDir` directory. This file is the shared context log — each previous skill (reproduce, diagnose, fix) appends its findings to it.

If `report.md` is missing or empty, generate a minimal comment (see "Fallback" section below).

## Step 2: Generate Comment

Generate and return a GitHub comment following the template below.

### Fix Line Instructions

The **Fix** line in the template has three possible forms. Choose the one that matches the triage outcome:

1. **You created a fix:** Use `I was able to fix this issue.` and include the suggested fix link.
2. **The issue is already fixed on main** (e.g. the user is on an older major version and the bug doesn't reproduce on current main): Use `This issue has already been fixed.` and tell the user how to get the fix (e.g. upgrade). Link the relevant upgrade guide if applicable: [v6](https://v6.docs.astro.build/en/guides/upgrade-to/v6/), [v5](https://docs.astro.build/en/guides/upgrade-to/v5/).
3. **You could not find or create a fix:** Use `I was unable to find a fix for this issue.` and give guidance or a best guess at where the fix might be.

### Template

```markdown
**[I was able to reproduce this issue. / I was unable to reproduce this issue.]** [2-3 sentences describing the root cause, result, and key observations.]

**Fix:** **[See Fix Line Instructions above.]** [1-2 sentences describing the solution, where/when it was already fixed, or guidance on where a fix might be.] [If `branchName` is non-null: [View Suggested Fix](https://github.com/withastro/astro/compare/{branchName}?expand=1)]

**Impact:** [Single sentence describing how you would have triggered the bug - or just the word "Unknown" if not determined.]

<details>
<summary><em>Full Triage Report</em></summary>

[Include the full contents of report.md here, formatted for readability]

</details>

_This report was made by an LLM. Mistakes happen, check important info._
```

## Optional Follow-up Task

You MAY SUGGEST to the user, as a potential follow-up step, to post the issue to GitHub directly. However you CANNOT DO THIS STEP unless the user explicitly asks.

```bash
gh issue comment <issue_number> --body <comment>
gh issue comment <issue_number> --body-file <path-to-file>
```
