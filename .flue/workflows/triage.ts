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

If there is new, actionable information that could lead to a different reproduction result
than what was already attempted, respond with exactly "yes".
If the new comments are just acknowledgments, thanks, unrelated discussion, or do not add
meaningful reproduction information, respond with exactly "no".`,
			{ result: v.picklist(['yes', 'no']) },
		);

		if (shouldRetriage === 'no') {
			return { skipped: true, reason: 'No new actionable information' };
		}
	}

	// Run the triage pipeline: reproduce → diagnose → fix
	const reproduceResult = await flue.skill('triage/reproduce.md', {
		args: {
			issueTitle: issue.title,
			issueBody: issue.body,
			issueComments: issue.comments,
		},
		result: reproductionResultSchema,
	});
	const diagnoseResult = await flue.skill('triage/diagnose.md', { result: diagnoseResultSchema });
	const fixResult = await flue.skill('triage/fix.md', { result: fixResultSchema });

	let isPushed = false;
	if (fixResult.fixed) {
		// Check for uncommitted canges and commit them
		const status = await flue.shell('git status --porcelain');
		if (status.stdout.trim()) {
			await flue.shell('git add -A');
			await flue.shell(
				`git commit -m ${JSON.stringify(fixResult.commitMessage ?? 'fix(auto-triage): automated fix')}`,
			);
		}
		const pushResult = await flue.shell(`git push origin HEAD:refs/heads/${flue.branch}`);
		isPushed = pushResult.exitCode === 0;
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

	if (reproduceResult.reproducible || reproduceResult.skipped) {
		await flue.shell(
			`gh issue edit ${issueNumber} --remove-label "needs triage" --remove-assignee "astrobot-houston"`,
			{ env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN } },
		);
	}

	// If not reproducible: "needs triage" label stays, Houston stays assigned.
	// The loop continues when the author (or another user) replies.
	return { reproduceResult, diagnoseResult, fixResult, isPushed };
}
