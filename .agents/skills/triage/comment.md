# Comment

Generate a GitHub issue comment from triage findings.

**CRITICAL: You MUST always produce a GitHub comment as your final output, regardless of what input files are available. Even if `report.md` is missing or empty, you must still produce a comment. In that case, produce a minimal comment stating that automated triage could not be completed.**

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

Generate and return a GitHub comment following this template. Adapt it to fit the findings:

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
**[I was able to reproduce this issue. / I was unable to reproduce this issue.]** [1-2 sentences describing the result and key observations.]

**Fix:** [If `branchName` arg is non-null, include: [Create PR](https://github.com/withastro/astro/compare/{branchName}?expand=1)] **[I was able to fix this issue. / I was unable to fix this issue.]** [1-2 sentences describing the solution and key observations. Even if no fix was created, you can still use this space to give guidance or "a best guess" at where the fix might be.]

**Cause:** [Single sentence explaining the root cause - or just the word "Unknown" if not determined.]

**Impact:** [Single sentence describing who is affected and how - or just the word "Unknown" if not determined.]

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
