import type { FlueClient } from '@flue/client';
import { anthropic, github, githubBody } from '@flue/client/proxies';
import * as v from 'valibot';
import { fetchCIFailureLogs, postPRComment } from './github.ts';

export const proxies = {
	anthropic: anthropic(),
	github: github({
		policy: {
			base: 'allow-read',
			allow: [
				// Allow GraphQL
				{ method: 'POST', path: '/graphql', body: githubBody.graphql() },
				// Allow git clone, fetch, and push over smart HTTP transport
				{ method: 'GET', path: '/*/*/info/refs' },
				{ method: 'POST', path: '/*/*/git-upload-pack' },
				{ method: 'POST', path: '/*/*/git-receive-pack' },
			],
		},
	}),
};

export const args = v.object({
	prNumber: v.number(),
});

export default async function mergeFix(flue: FlueClient, { prNumber }: v.InferOutput<typeof args>) {
	const branch = 'ci/merge-main-to-next';

	// Fetch CI failure logs before entering the sandbox.
	// The gh CLI doesn't work inside the Flue sandbox (auth goes through a proxy),
	// so we fetch logs here in the orchestrator and pass them to the skill.
	const ciLogs = await fetchCIFailureLogs(branch);

	// Run tests and fix failures.
	// Conflicts have already been resolved and deps installed by the merge action.
	// This skill only needs to analyze CI failure logs and fix the specific tests.
	const fixResult = await flue.skill('merge/fix-tests.md', {
		args: { prNumber, ciLogs },
		result: v.object({
			testsPass: v.pipe(v.boolean(), v.description('true if all tests pass after fixes')),
			fixedFiles: v.pipe(
				v.array(v.string()),
				v.description('List of test files or source files that were modified to fix failures'),
			),
			remainingFailures: v.pipe(
				v.array(v.string()),
				v.description(
					'Test names or files that still fail and could not be resolved automatically',
				),
			),
		}),
	});

	// Commit and push if there are changes
	const status = await flue.shell('git status --porcelain');
	if (status.stdout.trim()) {
		await flue.shell('git add -A');
		await flue.shell('git commit -m "chore: fix test failures for main-to-next merge"');
		const pushResult = await flue.shell(`git push origin ${branch}`);
		console.info('push result:', pushResult);

		if (pushResult.exitCode !== 0) {
			return { pushed: false, testsPass: fixResult.testsPass };
		}
	}

	// Post a summary comment on the PR
	const summaryParts = [];
	if (fixResult.fixedFiles.length > 0) {
		summaryParts.push(`- Fixed test failures in: ${fixResult.fixedFiles.join(', ')}`);
	}
	if (fixResult.remainingFailures.length > 0) {
		summaryParts.push(
			`- ⚠️ Remaining failures that need manual attention: ${fixResult.remainingFailures.join(', ')}`,
		);
	}

	if (summaryParts.length > 0) {
		const commentBody = `## Automated Test Fix

${summaryParts.join('\n')}

${fixResult.testsPass ? 'All tests pass — this PR should be ready for review.' : 'Some tests still fail — manual intervention may be needed.'}`;

		await postPRComment(prNumber, commentBody);
	}

	return {
		pushed: true,
		testsPass: fixResult.testsPass,
		fixedFiles: fixResult.fixedFiles,
		remainingFailures: fixResult.remainingFailures,
	};
}
