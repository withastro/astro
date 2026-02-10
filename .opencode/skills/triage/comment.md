# Comment

Generate a GitHub issue comment from triage findings.

**CRITICAL: You MUST always produce a GitHub comment as your final output, regardless of what input files are available. Even if `report.md` is missing or empty, you must still produce a comment. In that case, produce a minimal comment stating that automated triage could not be completed.**

## Prerequisites

- The `triageDir` directory (provided in args) exists
- `report.md` in that directory MAY exist — this contains the full context from all previous skills (reproduction, diagnosis, fix)
- `branchName` (from args) — if non-null, the fix was pushed to this branch. Include a "Create PR" link. If null, no branch was pushed — omit the link.

## Overview

1. Read `report.md` from the triage directory
2. Generate a GitHub comment following the template below
3. Optionally post the comment if the user wants

## Step 1: Read Triage Output

Read `report.md` from the `triageDir` directory (provided in args). This file is the shared context log — each previous skill (reproduce, diagnose, fix) appends its findings to it.

If `report.md` is missing or empty, generate a minimal comment (see "Fallback" section below).

## Step 2: Generate Comment

Generate a comment following this template. Adapt it to fit the findings:

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

*This report was made by an LLM. Mistakes happen, check important info.*
```

## Step 3: Post the Comment (Optional)

If the user wants to post the comment to GitHub, you can do so with the `gh` CLI:

```bash
gh issue comment <issue_number> --body-file <path-to-comment-file>
```

You can suggest posting it if you think it would be helpful.
