import type { Flue } from '@flue/client';
import * as v from 'valibot';

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

const issueDetailsSchema = v.object({
	title: v.string(),
	body: v.string(),
	author: v.object({ login: v.string() }),
	labels: v.array(v.looseObject({ name: v.string() })),
	createdAt: v.string(),
	state: v.string(),
	number: v.number(),
	url: v.string(),
	comments: v.array(
		v.looseObject({
			author: v.object({ login: v.string() }),
			authorAssociation: v.string(),
			body: v.string(),
			createdAt: v.string(),
		}),
	),
});
type IssueDetails = v.InferOutput<typeof issueDetailsSchema>;

async function shouldRetriage(flue: Flue, issue: IssueDetails): Promise<'yes' | 'no'> {
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

const repoLabelSchema = v.object({
	name: v.string(),
	description: v.nullable(v.string()),
});
type RepoLabel = v.InferOutput<typeof repoLabelSchema>;

async function fetchRepoLabels(flue: Flue): Promise<{
	priorityLabels: RepoLabel[];
	packageLabels: RepoLabel[];
}> {
	const labelsJson = await flue.shell(
		"gh api repos/withastro/astro/labels --paginate --jq '.[] | {name, description}'",
		{ env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN } },
	);
	const allLabels = v.parse(
		v.array(repoLabelSchema),
		labelsJson.stdout
			.trim()
			.split('\n')
			.filter(Boolean)
			.map((line) => JSON.parse(line)),
	);

	return {
		priorityLabels: allLabels.filter((l) => /^- P\d/.test(l.name)),
		packageLabels: allLabels.filter((l) => l.name.startsWith('pkg:')),
	};
}

async function selectTriageLabels(
	flue: Flue,
	{ comment, packageLabels }: { comment: string; packageLabels: RepoLabel[] },
): Promise<string> {
	const labelResult = await flue.prompt(
		`Label the following GitHub issue based on the triage report that was already posted.

The report already contains a **Priority** judgment with a specific priority label. Your job is to:
1. Extract the priority label that was already chosen in the report's Priority section.
2. Select 0-3 package labels based on where the issue lives (or most likely lives) in the monorepo.

### Rules
- The priority label has already been decided in the report. Extract it exactly as written.
- Select 0-3 package labels based on the triage report's findings. If you cannot confidently determine the affected package(s), return an empty array for packages.
- Return the exact label names as they appear in the lists below — do not modify them.

### Package Labels (select zero or more)
${packageLabels.map((l) => `- "${l.name}": ${l.description || '(no description)'}`).join('\n')}

--- 

<triage-report format="md">
${comment}
</triage-report>
`,
		{
			result: v.object({
				labels: v.pipe(
					v.array(v.string()),
					v.nonEmpty('Labels array must contain at least the priority label.'),
					v.description(
						'The labels to apply to the issue. Must include the priority label from the comment\'s Priority section, plus any selected package labels (e.g. ["- P2: important", "pkg: react"]).',
					),
				),
			}),
		},
	);

	return labelResult.labels.map((l) => `--add-label ${JSON.stringify(l)}`).join(' ');
}

async function fetchIssue(flue: Flue, issueNumber: number) {
	const result = await flue.shell(
		`gh issue view ${issueNumber} --json title,body,author,labels,createdAt,state,number,url,comments`,
		{
			env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
		},
	);
	return v.parse(issueDetailsSchema, JSON.parse(result.stdout));
}

async function runTriagePipeline(
	flue: Flue,
	issueNumber: number,
	issueData: IssueDetails,
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
	const issueDetails = JSON.stringify(issueData);
	const reproduceResult = await flue.skill('triage/reproduce.md', {
		args: { issueNumber, issueDetails },
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
		args: { issueDetails },
		result: v.object({
			confidence: v.pipe(
				v.nullable(v.picklist(['high', 'medium', 'low'])),
				v.description('Diagnosis confidence level, null if not attempted'),
			),
		}),
	});
	const verifyResult = await flue.skill('triage/verify.md', {
		args: { issueDetails },
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
		args: { issueDetails },
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
	const { issueNumber } = v.parse(v.object({ issueNumber: v.number() }), flue.args);
	const issueDetails = await fetchIssue(flue, issueNumber);

	// If there are prior comments, this is a re-triage. Check whether new
	// actionable information has been provided before running the full pipeline.
	const hasExistingConversation = issueDetails.comments.length > 0;
	if (hasExistingConversation) {
		const shouldRetriageResult = await shouldRetriage(flue, issueDetails);

		if (shouldRetriageResult === 'no') {
			return { skipped: true, reason: 'No new actionable information' };
		}
	}

	// Run the triage pipeline: reproduce → diagnose → verify → fix
	const triageResult = await runTriagePipeline(flue, issueNumber, issueDetails);
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

	// Fetch repo labels upfront so we can pass priority labels to the comment
	// skill (which selects the priority) and package labels to the label selector.
	const { priorityLabels, packageLabels } = await fetchRepoLabels(flue);
	assert(priorityLabels.length > 0, 'no priority labels found');
	assert(packageLabels.length > 0, 'no package labels found');

	const branchName = isPushed ? flue.branch : null;
	const comment = await flue.skill('triage/comment.md', {
		args: { branchName, priorityLabels },
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
			comment,
			packageLabels,
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
