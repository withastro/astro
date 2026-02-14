import type { Flue } from '@flue/client';
import * as v from 'valibot';

async function shouldRetriage(
	flue: Flue,
	issue: {
		title: string;
		body: string;
		comments: Array<{ author: { login: string }; body: string }>;
	},
): Promise<'yes' | 'no'> {
	return flue.prompt(
		`You are reviewing a GitHub issue conversation to decide whether a triage re-run is warranted.

## Issue
**${issue.title}**

${issue.body}

## Conversation
${issue.comments.map((c) => `**@${c.author.login}:**\n${c.body}`).join('\n\n---\n\n')}

## Your Task
Look at the messages since the last comment from astrobot-houston (or github-actions[bot]).
Consider comments from the original poster, maintainers, or other users who may have provided:
- New reproduction steps or environment details
- Corrections to a previously attempted reproduction
- Additional context about when/how the bug occurs
- Different configurations or versions to try

Then decide how to respond:
1. If there is new, actionable information that could lead to a different reproduction result
than what was already attempted, respond with "yes".
2. If someone is intentionally asking you to retry triage, respond with "yes".
3. If the new comments are just acknowledgments, thanks, unrelated discussion, or do not add
meaningful reproduction information, respond with "no".

Return only "yes" or "no" inside the ---RESULT_START--- / ---RESULT_END--- block.`,
		{ result: v.picklist(['yes', 'no']) },
	);
}

async function selectTriageLabels(
	flue: Flue,
	{ issueJson, comment }: { issueJson: string; comment: string },
): Promise<string | null> {
	// Fetch all repo labels and filter to priority + package labels.
	const labelsJson = await flue.shell(
		"gh api repos/withastro/astro/labels --paginate --jq '.[] | {name, description}'",
		{ env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN } },
	);
	const allLabels = labelsJson.stdout
		.trim()
		.split('\n')
		.filter(Boolean)
		.map((line) => JSON.parse(line) as { name: string; description: string });

	const priorityLabels = allLabels.filter((l) => /^- P\d/.test(l.name));
	const packageLabels = allLabels.filter((l) => l.name.startsWith('pkg:'));

	const labelResult = await flue.prompt(
		`Label the following GitHub issue based on our Triage Report which summarizes what we learned in our attempt to reproduce, diagnose, and fix the issue.

Select the most appropriate labels from the list below. Use the label descriptions to guide your decision, combined with the triage report's cause and impact analysis.

### Rules
- Select exactly ONE priority label based on the label description and the severity and impact of the bug. Pay close attention to the "Cause" and "Impact" sections of the triage report.
- You must select ONE priority label! If you are not sure, just use your best judgement based on the label descriptions and the findings of the triage report.
- Select 0-3 package labels based on where where the issue lives (or most likely lives) in the monorepo. The triage report's diagnosis should make it clear. If you cannot confidently determine the affected package(s), return an empty array for packages.
- Return the exact label names as they appear above — do not modify them.

### Priority Labels (select exactly one)
${priorityLabels.map((l) => `- "${l.name}": ${l.description || '(no description)'}`).join('\n')}

### Package Labels (select zero or more)
${packageLabels.map((l) => `- "${l.name}": ${l.description || '(no description)'}`).join('\n')}

--- 

<github-issue format="json">
${issueJson}
</github-issue>

<triage-report format="md">
${comment}
</triage-report>
`,
		{
			result: v.object({
				labels: v.pipe(
					v.array(v.string()),
					v.description(
						'The labels to apply to the issue (e.g. ["- P1: chore", "pkg: react"]). Array must contain one "priority" label.',
					),
				),
			}),
		},
	);

	if (labelResult.labels.length === 0) return null;
	return labelResult.labels.map((l) => `--add-label ${JSON.stringify(l)}`).join(' ');
}

async function fetchIssue(flue: Flue, issueNumber: number) {
	const result = await flue.shell(`gh issue view ${issueNumber} --json title,body,comments`, {
		env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
	});
	return v.parse(
		v.object({
			title: v.string(),
			body: v.string(),
			comments: v.array(
				v.looseObject({
					author: v.object({ login: v.string() }),
					body: v.string(),
				}),
			),
		}),
		JSON.parse(result.stdout),
	);
}

async function runTriagePipeline(
	flue: Flue,
	issueNumber: number,
): Promise<{
	/** The last pipeline stage that completed successfully. */
	completedStage: 'reproduce' | 'verify' | 'fix';
	reproducible: boolean;
	skipped: boolean;
	verdict: 'bug' | 'intended-behavior' | 'unclear' | null;
	diagnosisConfidence: 'high' | 'medium' | 'low' | null;
	fixed: boolean;
	commitMessage: string | null;
}> {
	const reproduceResult = await flue.skill('triage/reproduce.md', {
		args: { issueNumber },
		result: v.object({
			reproducible: v.pipe(
				v.boolean(),
				v.description('true if the bug was successfully reproduced, false otherwise'),
			),
			skipped: v.pipe(
				v.boolean(),
				v.description(
					'true if reproduction was intentionally skipped (host-specific, unsupported version, etc.)',
				),
			),
		}),
	});

	if (reproduceResult.skipped || !reproduceResult.reproducible) {
		return {
			completedStage: 'reproduce',
			reproducible: reproduceResult.reproducible,
			skipped: reproduceResult.skipped,
			verdict: null,
			diagnosisConfidence: null,
			fixed: false,
			commitMessage: null,
		};
	}

	const diagnoseResult = await flue.skill('triage/diagnose.md', {
		result: v.object({
			confidence: v.pipe(
				v.nullable(v.picklist(['high', 'medium', 'low'])),
				v.description('Diagnosis confidence level, null if not attempted'),
			),
		}),
	});
	const verifyResult = await flue.skill('triage/verify.md', {
		result: v.object({
			verdict: v.pipe(
				v.picklist(['bug', 'intended-behavior', 'unclear']),
				v.description('Whether the reported behavior is a bug, intended behavior, or unclear'),
			),
			confidence: v.pipe(
				v.picklist(['high', 'medium', 'low']),
				v.description('Confidence level in the verdict'),
			),
		}),
	});

	if (verifyResult.verdict === 'intended-behavior') {
		return {
			completedStage: 'verify',
			reproducible: true,
			skipped: false,
			verdict: verifyResult.verdict,
			diagnosisConfidence: diagnoseResult.confidence,
			fixed: false,
			commitMessage: null,
		};
	}

	const fixResult = await flue.skill('triage/fix.md', {
		result: v.object({
			fixed: v.pipe(
				v.boolean(),
				v.description('true if the bug was successfully fixed and verified'),
			),
			commitMessage: v.pipe(
				v.nullable(v.string()),
				v.description(
					'A short commit message describing the fix, e.g. "fix(auto-triage): prevent crash when rendering client:only components". null if not fixed.',
				),
			),
		}),
	});
	return {
		completedStage: 'fix',
		reproducible: true,
		skipped: false,
		verdict: verifyResult.verdict,
		diagnosisConfidence: diagnoseResult.confidence,
		fixed: fixResult.fixed,
		commitMessage: fixResult.commitMessage,
	};
}

export default async function triage(flue: Flue) {
	const { issueNumber } = flue.args as { issueNumber: number };
	const issueData = await fetchIssue(flue, issueNumber);

	// If there are prior comments, this is a re-triage. Check whether new
	// actionable information has been provided before running the full pipeline.
	const hasExistingConversation = issueData.comments.length > 0;
	if (hasExistingConversation) {
		const shouldRetriageResult = await shouldRetriage(flue, issueData);

		if (shouldRetriageResult === 'no') {
			return { skipped: true, reason: 'No new actionable information' };
		}
	}

	// Run the triage pipeline: reproduce → diagnose → verify → fix
	const triageResult = await runTriagePipeline(flue, issueNumber);
	let isPushed = false;

	// If a successful fix was created, push the fix up to a new branch on GitHub.
	// The comment we post below will reference that branch, then a maintainer can choose to:
	// - checkout that branch locally, using the fix as a starting point
	// - create a PR from that branch entirely in the GH UI
	// - ignore it completely
	if (triageResult.fixed) {
		// Check if the fix skill left uncommitted changes in packages/
		const status = await flue.shell('git status --porcelain');
		if (status.stdout.trim()) {
			await flue.shell(`git checkout -B ${flue.branch}`);
			await flue.shell('git add -A');
			await flue.shell(
				`git commit -m ${JSON.stringify(triageResult.commitMessage ?? 'fix(auto-triage): automated fix')}`,
			);
			const pushResult = await flue.shell(`git push -f origin ${flue.branch}`);
			console.info('push result:', pushResult);
			isPushed = pushResult.exitCode === 0;
		}
	}

	const branchName = isPushed ? flue.branch : null;
	const comment = await flue.skill('triage/comment.md', {
		args: { branchName },
		result: v.pipe(
			v.string(),
			v.description(
				'Return only the GitHub comment body generated from the template, following the included template directly. This returned comment must start with "**I was able to reproduce this issue.**" or "**I was unable to reproduce this issue.**"',
			),
		),
	});

	await flue.shell(`gh issue comment ${issueNumber} --body-file -`, {
		stdin: comment,
		env: { GH_TOKEN: flue.secrets.FREDKBOT_GITHUB_TOKEN },
	});

	if (triageResult.reproducible) {
		await flue.shell(`gh issue edit ${issueNumber} --remove-label "needs triage"`, {
			env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
		});

		const labelFlags = await selectTriageLabels(flue, {
			issueJson: JSON.stringify(issueData),
			comment,
		});
		if (labelFlags) {
			await flue.shell(`gh issue edit ${issueNumber} ${labelFlags}`, {
				env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
			});
		}
	} else if (triageResult.skipped) {
		// Triage was skipped due to a runner limitation. Keep "needs triage" so a
		// maintainer can still pick it up, and add "auto triage skipped" to prevent
		// the workflow from re-running on every new comment.
		await flue.shell(`gh issue edit ${issueNumber} --add-label "auto triage skipped"`, {
			env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
		});
	} else {
		// Not reproducible: do nothing. The "needs triage" label stays on the issue
		// so that it can continue to be worked on and triaged by the humans.
	}
	return { ...triageResult, isPushed };
}
