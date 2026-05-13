import type { FlueContext, FlueSession } from '@flue/sdk/client';
import { defineCommand } from '@flue/sdk/node';
import * as v from 'valibot';
import {
	GITHUB_TOKEN_BASE,
	type IssueDetails,
	type RepoLabel,
	addGitHubLabels,
	fetchIssueDetails,
	fetchRepoLabels,
	postGitHubComment,
	removeGitHubLabel,
} from '../lib/github.ts';

// CLI-only agent: no HTTP trigger. Invoked from GitHub Actions via `flue run issue-triage`.
export const triggers = {};

// Define commands that are allowed as pass-through to the local GH Actions container.
const bgproc = defineCommand('bgproc');
const agentBrowser = defineCommand('agent-browser');
const node = defineCommand('node');
const pnpm = defineCommand('pnpm');
const gh = defineCommand('gh', { env: { GH_TOKEN: GITHUB_TOKEN_BASE } });
const git = defineCommand('git');
const gitWithAuth = defineCommand('git', { env: { GH_TOKEN: GITHUB_TOKEN_BASE } });

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

async function shouldRetriage(session: FlueSession, issue: IssueDetails): Promise<'yes' | 'no'> {
	return session.prompt(
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
	session: FlueSession,
	{
		comment,
		priorityLabels,
		packageLabels,
	}: { comment: string; priorityLabels: RepoLabel[]; packageLabels: RepoLabel[] },
): Promise<string[]> {
	const priorityLabelNames = priorityLabels.map((l) => l.name);
	const packageLabelNames = packageLabels.map((l) => l.name);

	const labelResult = await session.prompt(
		`Label the following GitHub issue based on the triage report that was already posted.

Select labels for this issue from the lists below based on the triage report. Select exactly one priority label (the report's **Priority** section is a strong hint) and 0-3 package labels based on where the issue lives in the monorepo and how it manifests.

### Priority Labels (select exactly one)
${priorityLabels.map((l) => `- "${l.name}": ${l.description || '(no description)'}`).join('\n')}

### Package Labels (select zero or more)
${packageLabels.map((l) => `- "${l.name}": ${l.description || '(no description)'}`).join('\n')}

--- 

<triage-report format="md">
${comment}
</triage-report>
`,
		{
			result: v.object({
				priority: v.pipe(
					v.picklist(priorityLabelNames),
					v.description(
						'The priority label to apply. Must be one of the exact priority label names listed above.',
					),
				),
				packages: v.pipe(
					v.array(v.picklist(packageLabelNames)),
					v.description(
						'Package labels to apply (0-3). Each must be one of the exact package label names listed above.',
					),
				),
			}),
		},
	);

	return [labelResult.priority, ...labelResult.packages];
}

interface PreviewRelease {
	/** Install URLs for each published package, e.g. "https://pkg.pr.new/astro@abc1234" */
	urls: string[];
}

async function publishPreviewRelease(session: FlueSession): Promise<PreviewRelease | null> {
	// Determine which package directories were modified relative to main.
	const diffResult = await session.shell('git diff main --name-only', { commands: [git] });
	if (!diffResult.stdout.trim()) return null;

	const changedFiles = diffResult.stdout.trim().split('\n');
	const packageDirs = new Set<string>();
	for (const file of changedFiles) {
		// Match packages/<name>/... or packages/integrations/<name>/...
		const match = file.match(/^(packages\/(?:integrations\/)?[^/]+)\//);
		if (match) {
			packageDirs.add(match[1]);
		}
	}
	if (packageDirs.size === 0) return null;

	const packages = [...packageDirs].join(' ');
	const publishResult = await session.shell(
		`pnpm dlx pkg-pr-new publish --pnpm --compact --no-template --comment=off --json preview-release.json ${packages}`,
		{ commands: [pnpm] },
	);

	if (publishResult.exitCode !== 0) {
		console.warn('Preview release publish failed:', publishResult.stderr);
		return null;
	}

	// Parse the JSON output to extract package URLs.
	const jsonResult = await session.shell(
		"node -e \"process.stdout.write(require('fs').readFileSync('preview-release.json','utf8'))\"",
		{ commands: [node] },
	);
	try {
		const output = JSON.parse(jsonResult.stdout.trim());
		const urls = (output.packages as Array<{ url: string }>).map((p) => p.url);
		return urls.length > 0 ? { urls } : null;
	} catch {
		console.warn('Failed to parse preview release JSON output');
		return null;
	}
}

async function runTriagePipeline(
	session: FlueSession,
	issueNumber: number,
	issueDetails: IssueDetails,
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
	const reproduceResult = await session.skill('triage/reproduce.md', {
		args: { issueNumber, issueDetails },
		commands: [gh, bgproc, agentBrowser, git, node, pnpm],
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

	const diagnoseResult = await session.skill('triage/diagnose.md', {
		args: { issueDetails },
		commands: [gh, bgproc, agentBrowser, git, node, pnpm],
		result: v.object({
			confidence: v.pipe(
				v.nullable(v.picklist(['high', 'medium', 'low'])),
				v.description('Diagnosis confidence level, null if not attempted'),
			),
		}),
	});
	const verifyResult = await session.skill('triage/verify.md', {
		args: { issueDetails },
		commands: [gh, bgproc, agentBrowser, git, node, pnpm],
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

	const fixResult = await session.skill('triage/fix.md', {
		args: { issueDetails },
		commands: [gh, bgproc, agentBrowser, git, node, pnpm],
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

export default async function ({ init, payload }: FlueContext) {
	const issueNumber = payload.issueNumber as number;
	const branch = `flue/fix-${issueNumber}`;

	// Initialize the agent and session.
	const agent = await init({
		sandbox: 'local',
		model: 'anthropic/claude-opus-4-6',
	});
	const session = await agent.session();

	const issueDetails = await fetchIssueDetails(issueNumber);

	// If there are prior comments, this is a re-triage. Check whether new
	// actionable information has been provided before running the full pipeline.
	const hasExistingConversation = issueDetails.comments.length > 0;
	if (hasExistingConversation) {
		const shouldRetriageResult = await shouldRetriage(session, issueDetails);
		if (shouldRetriageResult === 'no') {
			return { skipped: true, reason: 'No new actionable information' };
		}
	}

	// Run the triage pipeline: reproduce → diagnose → verify → fix
	const triageResult = await runTriagePipeline(session, issueNumber, issueDetails);
	let isPushed = false;

	// Push the fix branch if there are meaningful changes (fix, failing test, etc.).
	// The comment we post below will reference that branch, then a maintainer can choose to:
	// - checkout that branch locally, using the fix as a starting point
	// - create a PR from that branch entirely in the GH UI
	// - ignore it completely
	{
		const diff = await session.shell('git diff main --stat', { commands: [git] });
		if (diff.stdout.trim()) {
			const status = await session.shell('git status --porcelain', { commands: [git] });
			if (status.stdout.trim()) {
				await session.shell('git add -A', { commands: [git] });
				const defaultMessage = triageResult.fixed
					? 'fix(auto-triage): automated fix'
					: 'test(auto-triage): failing test and investigation notes';
				await session.shell(
					`git commit -m ${JSON.stringify(triageResult.commitMessage ?? defaultMessage)}`,
					{ commands: [git] },
				);
			}
			const pushResult = await session.shell(`git push -f origin ${branch}`, {
				commands: [gitWithAuth],
			});
			console.info('push result:', pushResult);
			isPushed = pushResult.exitCode === 0;
		}
	}

	// If a fix was successfully pushed, publish a preview release so the reporter
	// can immediately test the fix via `npm i <url>`.
	let previewRelease: PreviewRelease | null = null;
	if (triageResult.fixed && isPushed) {
		previewRelease = await publishPreviewRelease(session);
		if (previewRelease) {
			console.info('Preview release published:', previewRelease.urls);
		}
	}

	// Fetch repo labels upfront so we can pass priority labels to the comment
	// skill (which selects the priority) and package labels to the label selector.
	const { priorityLabels, packageLabels } = await fetchRepoLabels();
	assert(priorityLabels.length > 0, 'no priority labels found');
	assert(packageLabels.length > 0, 'no package labels found');

	const branchName = isPushed ? branch : null;
	const comment = await session.skill('triage/comment.md', {
		args: { branchName, priorityLabels, issueDetails, previewRelease },
		commands: [gh, git, node, pnpm],
		result: v.pipe(
			v.string(),
			v.description(
				'Return only the GitHub comment body generated from the template, following the included template directly. This returned comment must start with the bullet-point summary (- **Reproduced:** ...)',
			),
		),
	});

	await postGitHubComment(issueNumber, comment);

	if (triageResult.reproducible) {
		await removeGitHubLabel(issueNumber, 'needs triage');
		const selectedLabels = await selectTriageLabels(session, {
			comment,
			priorityLabels,
			packageLabels,
		});
		if (selectedLabels.length > 0) {
			await addGitHubLabels(issueNumber, selectedLabels);
		}
	} else if (triageResult.skipped) {
		// Triage was skipped due to a runner limitation. Keep "needs triage" so a
		// maintainer can still pick it up, and add "auto triage skipped" to prevent
		// the workflow from re-running on every new comment.
		await addGitHubLabels(issueNumber, ['auto triage skipped']);
	} else {
		// Not reproducible: do nothing. The "needs triage" label stays on the issue
		// so that it can continue to be worked on and triaged by the humans.
	}
	return { ...triageResult, isPushed, previewRelease };
}
