# Comment

Generate a GitHub issue comment from triage findings.

**CRITICAL: You MUST always read `report.md` and produce a GitHub comment as your final output, regardless of what input files are available. Even if `report.md` is missing or empty, you must still produce a comment. In that case, produce a minimal comment stating that automated triage could not be completed.**

**SCOPE: Your job is comment generation only. Finish your work once you've completed this workflow. Do NOT go further than this. It is no longer time to attempt reproduction, diagnosis, or fixing of the issue.**

## Prerequisites

These variables are referenced throughout this skill. They may be passed as args by an orchestrator, or inferred from the conversation when run standalone.

- **`triageDir`** — Directory containing the reproduction project (e.g. `triage/issue-123`). If not passed as an arg, infer from previous conversation.
- **`issueDetails`** - The GitHub API issue details payload. This must be provided explicitly by the user or available from prior conversation context / tool calls. If this data isn't available, you may run `gh issue view ${issue_number}` to load the missing issue details directly from GitHub.
- **`report.md`** — File in `triageDir` that MAY exist. Contains the full context from all previous skills (reproduction, diagnosis, fix). Contains everything that you need to know to generate your comment successfully.
- **`branchName`** — The branch name where a fix was pushed. If not passed as an arg, infer from previous conversation.
- **`priorityLabels`** — An array of `{ name, description }` objects representing the available priority labels for the repository. Used to select a priority in the comment.

## Overview

1. Read `report.md` from the triage directory
2. Generate a GitHub comment following the template below

## Step 1: Read Triage Output

Read `report.md` from the `triageDir` directory. This file is the shared context log — each previous skill (reproduce, diagnose, fix) appends its findings to it.

If `report.md` is missing or empty, generate a minimal comment (see "Fallback" section below).

## Step 2: Generate Comment

Generate and return a GitHub comment following the template below.

### "Fix" Instructions

The **Fix** line in the template has three possible forms. Choose the one that matches the triage outcome:

1. **You created a fix:** Use `I was able to fix this issue.` and include the suggested fix link.
2. **The issue is already fixed on main** (e.g. the user is on an older major version and the bug doesn't reproduce on current main): Use `This issue has already been fixed.` and tell the user how to get the fix (e.g. upgrade). Link the relevant upgrade guide if applicable: [v6](https://v6.docs.astro.build/en/guides/upgrade-to/v6/), [v5](https://docs.astro.build/en/guides/upgrade-to/v5/).
3. **You could not find or create a fix:** Use `I was unable to find a fix for this issue.` and give guidance or a best guess at where the fix might be.

### "Priority" Instructions

The **Priority** line communicates the severity of this issue to maintainers. Its goal is to answer the question: **"How bad is it?"**

Select exactly ONE priority label from the `priorityLabels` arg. Use the label descriptions to guide your decision, combined with the triage report's root cause and impact analysis. Render it in bold, with the `- ` prefix removed, like this: `**Priorty P2: Has Workaround.** Then, follow it with 1-2 sentences explaining _why_ you chose that priority. Answer: "who is likely to be affected and under what conditions?". If you are unsure, use your best judgment based on the label descriptions and the triage findings.

### Template

```markdown
**[I was able to reproduce this issue. / I was unable to reproduce this issue.]** [2-3 sentences describing the root cause, result, and key observations.]

**[See "Fix" Instructions above.]** [1-2 sentences describing the solution, where/when it was already fixed, or guidance on where a fix might be.] [If `branchName` is non-null: [View Suggested Fix](https://github.com/withastro/astro/compare/{branchName}?expand=1)]

**[See "Priority" Instructions above.]** [1-2 sentences explaining why this priority was chosen, who is likely to be affected, and under what conditions (this section should answer the question: "how bad is it?")]

<details>
<summary><em>Full Triage Report</em></summary>

[Include the full contents of report.md here, formatted for readability]

</details>

_This report was made by an LLM. Mistakes happen, check important info._
```

## Result

You MUST RETURN the generated comment text so that the user can review and post it themselves.

You MAY SUGGEST to the user that you (or they) could post the comment to the GitHub issue. **Do not post the comment yourself** — this should only be a suggestion. It would be a horrifying abuse of trust to the user if you posted to GitHub on their behalf without their explicit permission.

```bash
# Example Only:
gh issue comment <issue_number> --body <comment>
gh issue comment <issue_number> --body-file <path-to-file>
```
