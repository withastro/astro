# Comment

Generate a GitHub issue comment from triage findings.

**CRITICAL: You MUST always read `report.md` and produce a GitHub comment as your final output, regardless of what input files are available. Even if `report.md` is missing or empty, you must still produce a comment. In that case, produce a minimal comment stating that automated triage could not be completed.**

**SCOPE: Your job is comment generation only. Finish your work once you've completed this workflow. Do NOT go further than this. It is no longer time to attempt reproduction, diagnosis, or fixing of the issue. Do not spawn tasks/sub-agents.**

## Prerequisites

These variables are referenced throughout this skill. They may be passed as args by an orchestrator, or inferred from the conversation when run standalone.

- **`triageDir`** — Directory containing the reproduction project (e.g. `triage/issue-123`). If not passed as an arg, infer from previous conversation.
- **`issueDetails`** - The GitHub API issue details payload. This must be provided explicitly by the user or available from prior conversation context / tool calls. If this data isn't available, you may run `gh issue view ${issue_number}` to load the missing issue details directly from GitHub.
- **`report.md`** — File in `triageDir` that MAY exist. Contains the full context from all previous skills (reproduction, diagnosis, fix). Contains everything that you need to know to generate your comment successfully.
- **`branchName`** — The branch name where a fix was pushed. If not passed as an arg, infer from previous conversation.
- **`priorityLabels`** — An array of `{ name, description }` objects representing the available priority labels for the repository. Used to select a priority in the comment.
- **`previewRelease`** — An object with `{ urls: string[] }` containing pkg.pr.new install URLs for the affected packages, or `null` if no preview release was published. When present, include a "Try this fix" section in the comment.

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

1. **You created a fix:** Use `I found a potential fix for this issue.` and include the suggested fix link. Avoid claiming certainty, even if the fix passes tests, frame it as a suggestion that needs human review.
2. **The issue is already fixed on main** (e.g. the user is on an older major version and the bug doesn't reproduce on current main): Use `This issue has already been fixed.` and tell the user how to get the fix (e.g. upgrade). Link the relevant upgrade guide if applicable: [v6](https://docs.astro.build/en/guides/upgrade-to/v6/), [v5](https://docs.astro.build/en/guides/upgrade-to/v5/).
3. **Low-confidence or no fix:** Use `I wasn't able to find a fix, but I identified some areas that may be relevant.` and list the files/code paths that seem related. Frame this as a jumping-off point for a human, not a diagnosis. If a failing test was added, mention it.
4. **No leads at all:** Use `I was unable to determine the cause of this issue.` This should be rare, only use it when you genuinely have nothing useful to point to.

### "Priority" Instructions

The **Priority** line communicates the severity of this issue to maintainers. Its goal is to answer the question: **"How bad is it?"**

Select exactly ONE priority label from the `priorityLabels` arg. Use the label descriptions to guide your decision, combined with the triage report's root cause and impact analysis. Render it in bold, with the `- ` prefix removed, like this: `**Priority P2: Has Workaround.**` Then, follow it with 1-2 sentences explaining _why_ you chose that priority. Answer: "who is likely to be affected and under what conditions?". If you are unsure, use your best judgment based on the label descriptions and the triage findings.

**Priority calibration — err on the side of lower priority:**

- **Experimental/unstable features** should almost never be higher than P3. Users of experimental features accept instability. (e.g. a broken option in `experimental.fonts`)
- **Niche adapter/integration combos** (e.g. MDX + Svelte + Cloudflare) are typically P3 or lower unless they affect a core workflow.
- **P4 vs P5** — the key question is breadth: how many typical Astro users would hit this in a standard workflow? (e.g. P4: wrong output for a common routing pattern; P5: `astro build` crashes for most projects)
- **P2: Has Workaround vs P2: Nice to Have** — pick based on whether something behaves unexpectedly (but circumventable) vs. simply a convenience gap (e.g. Has Workaround: unexpected behavior with a way to restructure around it; Nice to Have: cosmetic issue in an error message). If there is no workaround at all, consider P3 or higher instead.
- **When selecting between similar labels**, always refer to their descriptions in `priorityLabels` to make the final call.
- **When in doubt, go lower.** A P3 that gets bumped up by a maintainer is much better than a P5 that causes false alarm.

### Template

The comment must start with an at-a-glance summary, followed by short explanations, then the full report in a collapsible section. Keep the top section scannable, a maintainer should understand the status in under 5 seconds and be able to quickly jump into fixing the issue.

```markdown
- **Reproduced:** [Yes / No / Skipped — reason]
- **Exploration:** [Yes / No / Partial / Already fixed on main] [If `branchName` is non-null: — [View branch](https://github.com/withastro/astro/compare/{branchName}?expand=1)]
- **Unit Test:** [Yes — `path/to/test.test.ts` / No — reason]
- **Priority:** [See "Priority" Instructions above. Keep to one line explaining why this priority was chosen, who is likely to be affected, and under what conditions (this section should answer the question: "how bad is it?")]

[2-3 sentences describing the root cause or key observations, or where/when it was already fixed. Be specific about what's happening and where in the codebase.]

**[See "Fix" Instructions above.]** [1-2 sentences describing the fix in more detail: what was changed, guidance on where a fix might be, or relevant code areas.]

[If `previewRelease` is non-null, include the "Try this fix" section below. If `previewRelease` is null, omit it entirely.]

### Try this fix

You can test this fix right now without waiting for a release:
```

[For each URL in previewRelease.urls, output it as an npm install command on its own line, e.g.:]
npm i <url>

```

[End of conditional "Try this fix" section.]

<details>
<summary><em>Full Triage Report</em></summary>

[Include the full contents of report.md here, formatted for readability]

</details>

_This report was made by an LLM. The analysis may be wrong, and the potential fix might not work, but is intended as a starting point for exploring the issue._
```

## Result

You MUST RETURN the generated comment text so that the user can review and post it themselves.

You MAY SUGGEST to the user that you (or they) could post the comment to the GitHub issue. **Do not post the comment yourself** — this should only be a suggestion. It would be a horrifying abuse of trust to the user if you posted to GitHub on their behalf without their explicit permission.

```bash
# Example Only:
gh issue comment <issue_number> --body <comment>
gh issue comment <issue_number> --body-file <path-to-file>
```
