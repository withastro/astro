import { createAgent, type FlueContext } from '@flue/runtime';
import { local } from '@flue/runtime/node';
import * as v from 'valibot';
import { GITHUB_TOKEN_BASE, gitPush } from '../../lib/github.ts';
import { fetchCIFailureLogs, postPRComment } from './github.ts';

export const args = v.object({
	prNumber: v.number(),
});

const agent = createAgent(() => ({
	sandbox: local({
		env: {
			// Read-only token for gh CLI reads inside the sandbox.
			// Write operations (git push, post comment) go through the orchestrator.
			GH_TOKEN: GITHUB_TOKEN_BASE,
		},
	}),
	model: 'anthropic/claude-opus-4-6',
}));

export async function run({ init, payload }: FlueContext) {
	const prNumber = payload.prNumber as number;
	const branch = 'ci/merge-main-to-next';

	const harness = await init(agent);
	const session = await harness.session();

	// Fetch CI failure logs before entering the sandbox.
	// The gh CLI doesn't work inside the Flue sandbox (auth goes through a proxy),
	// so we fetch logs here in the orchestrator and pass them to the skill.
	const ciLogs = await fetchCIFailureLogs(branch);

	// Fix CI failures: build errors, type errors, lint errors, and test failures.
	// Conflicts have already been resolved by the merge-resolve workflow.
	// Dependencies are installed but packages may NOT be built yet — the skill
	// handles building and fixing any errors that come up.
	const { data: fixResult } = await session.skill('merge', {
		args: {
			prNumber,
			ciLogs,
			step: 'fix-ci',
			instructions: 'Run only the "fix-ci" sub-skill from fix-ci.md.',
		},
		result: v.object({
			ciPass: v.pipe(v.boolean(), v.description('true if build + tests pass after fixes')),
			fixedFiles: v.pipe(
				v.array(v.string()),
				v.description('List of source or test files that were modified to fix failures'),
			),
			remainingFailures: v.pipe(
				v.array(v.string()),
				v.description(
					'Errors or test names that still fail and could not be resolved automatically',
				),
			),
		}),
	});

	// Commit and push if there are changes
	const status = await session.shell('git status --porcelain');
	if (status.stdout.trim()) {
		await session.shell('git add -A');
		await session.shell('git commit -m "chore: fix CI failures for main-to-next merge"');
		const pushResult = await gitPush(branch);
		console.info('push result:', pushResult);

		if (pushResult.exitCode !== 0) {
			return { pushed: false, ciPass: fixResult.ciPass };
		}
	}

	// Post a summary comment on the PR
	const summaryParts = [];
	if (fixResult.fixedFiles.length > 0) {
		summaryParts.push(`- Fixed failures in: ${fixResult.fixedFiles.join(', ')}`);
	}
	if (fixResult.remainingFailures.length > 0) {
		summaryParts.push(
			`- ⚠️ Remaining failures that need manual attention: ${fixResult.remainingFailures.join(', ')}`,
		);
	}

	if (summaryParts.length > 0) {
		const commentBody = `## Automated CI Fix

${summaryParts.join('\n')}

${fixResult.ciPass ? 'All checks pass — this PR should be ready for review.' : 'Some checks still fail — manual intervention may be needed.'}`;

		await postPRComment(prNumber, commentBody);
	}

	return {
		pushed: true,
		ciPass: fixResult.ciPass,
		fixedFiles: fixResult.fixedFiles,
		remainingFailures: fixResult.remainingFailures,
	};
}
