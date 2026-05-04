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

	// Fix CI failures: build errors, type errors, lint errors, and test failures.
	// Conflicts have already been resolved by the merge-resolve workflow.
	// Dependencies are installed but packages may NOT be built yet — the skill
	// handles building and fixing any errors that come up.
	const fixResult = await flue.skill('merge/fix-ci.md', {
		args: { prNumber, ciLogs },
		result: v.object({
			ciPass: v.pipe(
				v.boolean(),
				v.description('true if build + tests pass after fixes'),
			),
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
	const status = await flue.shell('git status --porcelain');
	if (status.stdout.trim()) {
		await flue.shell('git add -A');
		await flue.shell('git commit -m "chore: fix CI failures for main-to-next merge"');
		const pushResult = await flue.shell(`git push origin ${branch}`);
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
