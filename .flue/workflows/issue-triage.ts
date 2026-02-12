import type { Flue } from '@flue/client';
import * as v from 'valibot';

const reproductionResultSchema = v.object({
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
});

const diagnoseResultSchema = v.object({
	confidence: v.pipe(
		v.nullable(v.picklist(['high', 'medium', 'low'])),
		v.description('Diagnosis confidence level, null if not attempted'),
	),
});

const fixResultSchema = v.object({
	fixed: v.pipe(v.boolean(), v.description('true if the bug was successfully fixed and verified')),
	commitMessage: v.pipe(
		v.nullable(v.string()),
		v.description(
			'A short commit message describing the fix, e.g. "fix(auto-triage): prevent crash when rendering client:only components". null if not fixed.',
		),
	),
});

const labelResultSchema = v.object({
	labels: v.pipe(
		v.array(v.string()),
		v.description(
			'The labels to apply to the issue (e.g. ["P1: chore", "pkg: react"]). Array must contain one "priority" label.',
		),
	),
});

export default async function triage(flue: Flue) {
	const { issueNumber } = flue.args as {
		issueNumber: number;
	};

	const issueJson = await flue.shell(`gh issue view ${issueNumber} --json title,body,comments`, {
		env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
	});
	const issue = JSON.parse(issueJson.stdout) as {
		title: string;
		body: string;
		comments: Array<{ author: { login: string }; body: string }>;
	};

	// If there are prior comments, this is a re-triage. Check whether new
	// actionable information has been provided before running the full pipeline.
	const hasExistingConversation = issue.comments.length > 0;
	if (hasExistingConversation) {
		const shouldRetriage = await flue.prompt(
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

		if (shouldRetriage === 'no') {
			return { skipped: true, reason: 'No new actionable information' };
		}
	}

	// Run the triage pipeline: reproduce → diagnose → fix
	const reproduceResult = await flue.skill('triage/reproduce.md', {
		args: { issueNumber },
		result: reproductionResultSchema,
	});
	const diagnoseResult = await flue.skill('triage/diagnose.md', { result: diagnoseResultSchema });
	const fixResult = await flue.skill('triage/fix.md', { result: fixResultSchema });
	let isPushed = false;

	// If a successful fix was created, push the fix up to a new branch on GitHub.
	// The comment we post below will reference that branch, then a maintainer can choose to:
	// - checkout that branch locally, using the fix as a starting point
	// - create a PR from that branch entirely in the GH UI
	// - ignore it completely
	if (fixResult.fixed) {
		// Check if the fix skill left uncommitted changes in packages/
		const status = await flue.shell('git status --porcelain');
		// TODO: Assert flue.branch
		if (status.stdout.trim()) {
			await flue.shell(`git checkout -B ${flue.branch}`);
			await flue.shell('git add -A');
			// TODO: we should add comments to flue.shell internally, to find out why nothing happened.
			await flue.shell(
				`git commit -m ${JSON.stringify(fixResult.commitMessage ?? 'fix(auto-triage): automated fix')}`,
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
		env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
	});

	if (reproduceResult.reproducible) {
		await flue.shell(`gh issue edit ${issueNumber} --remove-label "needs triage"`, {
			env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
		});

		// Fetch all repo labels and select appropriate priority + package labels.
		const labelsJson = await flue.shell(
			"gh api repos/withastro/astro/labels --paginate --jq '.[] | {name, description}'",
			{ env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN } },
		);
		const allLabels = labelsJson.stdout
			.trim()
			.split('\n')
			.filter(Boolean)
			.map((line) => JSON.parse(line) as { name: string; description: string });

		// Filter to priority labels (P followed by a digit) and package labels (pkg: prefix)
		const priorityLabels = allLabels.filter((l) => /^- P\d/.test(l.name));
		const packageLabels = allLabels.filter((l) => l.name.startsWith('pkg:'));

		const labelResult = await flue.prompt(
			`Label the following GitHub issue based on our Triage Report which summarizes what we learned in our attempt to reproduce, diagnose, and fix the issue.

Select the most appropriate labels from the list below. Use the label descriptions to guide your decision, combined with the triage report's cause and impact analysis.

### Rules
- Select exactly ONE priority label based on the severity and impact of the bug. Pay close attention to the "Cause" and "Impact" sections of the triage report.
- You must select ONE priorty label! If you are not sure, just use your best judgement based on the label descriptions and the findings of the triage report.
- Select 0-3 package labels based on where where the issue lives (or most likely lives) in the monorepo. The triage report's diagnosis should make it clear. If you cannot confidently determine the affected package(s), return an empty array for packages.
- Return the exact label names as they appear above — do not modify them.

### Priority Labels (select exactly one)
${priorityLabels.map((l) => `- **${l.name}**: ${l.description || '(no description)'}`).join('\n')}

### Package Labels (select zero or more)
${packageLabels.map((l) => `- **${l.name}**: ${l.description || '(no description)'}`).join('\n')}

--- 

<issue format="md">
# ${issue.title}

${issue.body}
</issue>

<triage-report format="md">
${comment}
</triage-report>
`,
			{ result: labelResultSchema },
		);

		if (labelResult.labels.length > 0) {
			const labelFlags = labelResult.labels
				.map((l) => `--add-label ${JSON.stringify(l)}`)
				.join(' ');
			await flue.shell(`gh issue edit ${issueNumber} ${labelFlags}`, {
				env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
			});
		}
	} else if (reproduceResult.skipped) {
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
	return { reproduceResult, diagnoseResult, fixResult, isPushed };
}
