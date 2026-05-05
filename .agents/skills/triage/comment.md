# Comment

Generate a GitHub issue comment from triage findings.

**CRITICAL: You MUST always read `report.md` and produce a GitHub comment as your final output, regardless of what input files are available. Even if `report.md` is missing or empty, you must still produce a comment. In that case, produce a minimal comment stating that automated triage could not be completed.**

**SCOPE: Your job is comment generation only. Finish your work once you've completed this workflow. Do NOT go further than this. It is no longer time to attempt reproduction, diagnosis, or fixing of the issue. Do not spawn tasks/sub-agents.**

**HARD SCOPE RULES — do not violate these even if `report.md` is missing or sparse:**

- Do NOT read, grep, or explore any file in `packages/` or the wider codebase to fill in missing analysis.
- Do NOT run reproductions, builds, tests, or git/gh commands to fetch additional context beyond what's already in `issueDetails` and `report.md`.
- Do NOT invent investigation that was not actually performed by an earlier skill. If `report.md` is missing do not do the investigation yourself to compensate.
- You may only read: `report.md`, `issueDetails`, and the args passed in. Nothing else. If the material isn't there, fall back (see below).

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

If `report.md` is missing or empty, generate a minimal comment using the Fallback template (see below). **Do not investigate the issue yourself to compensate.** A missing report means the pipeline exited early (e.g. reproduction was skipped). Report that honestly — do not substitute your own exploration.

### Fallback (missing or empty `report.md`)

If `report.md` is missing or empty, return only this comment — no extended analysis, no "Full Triage Report" section:

```markdown
- **Reproduced:** Skipped
- **Exploration:** Skipped
- **Priority:** **[select from priorityLabels, default to lowest reasonable].** [short phrase]

Automated triage could not be completed for this issue. No reproduction or diagnosis data is available.

_This report was made by an LLM. The analysis may be wrong, and the potential fix might not work, but is intended as a starting point for exploring the issue._
```

## Step 2: Generate Comment

Generate and return a GitHub comment following the template below.

### Writing Style — Be Concise

Maintainers scan this comment in seconds. Every word has to earn its place.

- **Prefer short phrases over full sentences** in the bullets. A bullet is a label, not a paragraph.
- **Do not use em dashes (`—`) to extend a sentence** with extra clauses. If you're tempted to add " — and also ..." or " — which means ...", stop and cut it.
- **One idea per sentence.** If a sentence has two clauses joined by a dash, comma, or "which", split or delete one.
- **No hedging filler.** Drop phrases like "it appears that", "it seems like", "in some cases", "under certain conditions" unless they carry information.
- **Name things directly.** `astro build` crashes on page with `getStaticPaths` > `the build process encounters an issue when a page uses getStaticPaths`.

A good bullet reads like a log line. A good explanation sentence reads like a commit message.

### "Fix" Instructions

Choose the form that matches the triage outcome. Keep the follow-up sentence to **one short sentence, two max** — no em-dash clauses tacked on.

1. **You created a fix:** Use `I found a potential fix for this issue.` and include the suggested fix link. Frame it as a suggestion needing human review, even if it passes tests.
2. **The issue is already fixed on main** (e.g. the user is on an older major version and the bug doesn't reproduce on current main): Use `This issue has already been fixed.` and tell the user how to get the fix (e.g. upgrade). Link the relevant upgrade guide if applicable: [v6](https://docs.astro.build/en/guides/upgrade-to/v6/), [v5](https://docs.astro.build/en/guides/upgrade-to/v5/).
3. **Low-confidence or no fix:** Use `I wasn't able to find a fix, but I identified some areas that may be relevant.` and list the files/code paths that seem related. Frame this as a jumping-off point, not a diagnosis. If a failing test was added, mention it.
4. **No leads at all:** Use `I was unable to determine the cause of this issue.` Rare — only use it when you genuinely have nothing to point to.

**Do not suggest workflow-breaking workarounds.** If the user explicitly configured something (e.g. `prerenderEnvironment: 'node'`, a specific adapter, an opt-in feature, an integration), do NOT tell them to remove the option, use the default, disable the feature, or switch away from their stack. They chose that configuration deliberately. "Omit the option" or "use the default instead" is not a fix — it abandons the user's use case. The only acceptable guidance is toward a real fix, an upgrade, or an honest "no fix identified yet."

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

The comment must start with an at-a-glance summary, followed by short explanations, then the full report in a collapsible section. Keep the top section scannable — a maintainer should understand the status in under 5 seconds.

**Bullet rules:** each bullet after its label must be a short phrase, not a sentence. No em dashes stretching the phrase into a second clause. If you can't say it in ~10 words, cut it.

**Exploration bullet is driven by `branchName`, not by narrative:**

- If `branchName` is **null**: `Exploration` MUST be `Skipped`. Do not write "Partial" or "Yes" when there is no branch — the push stage found nothing worth committing, which means no real exploration output exists. A written analysis in `report.md` without any code changes is NOT exploration for the purposes of this bullet.
- If `branchName` is **non-null**: use `Yes`, `Partial`, or `Already fixed on main` as appropriate, and append the `— [View branch](...)` link.
- Never claim exploration that a maintainer cannot click through to verify.

```markdown
- **Reproduced:** [Yes / No / Skipped: <short reason>]
- **Exploration:** [Yes / Partial / Already fixed on main — [View branch](https://github.com/withastro/astro/compare/{branchName}?expand=1)  OR  Skipped (if branchName is null)]
- **Priority:** **[label name].** [one short phrase on who's affected — max ~15 words, no em-dash tail clause]

[2-3 short sentences on the root cause or where it's already fixed. Name the file/function. No em-dash subclauses. Cut anything that isn't load-bearing.]

**[See "Fix" Instructions above.]** [One short sentence, two max, on the fix or the relevant code area.]

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
