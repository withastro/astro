import type { FlueClient } from '@flue/client';
import { anthropic, github, githubBody } from '@flue/client/proxies';
import * as v from 'valibot';

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

	// Step 1: Verify conflict resolutions and resolve any remaining source code conflicts.
	// JSON/YAML conflicts were pre-stripped by the GitHub Action (keeping next side).
	// This skill checks that nothing important from main was lost, and resolves
	// any remaining conflict markers in .ts/.js/.md/.astro files.
	const verifyResult = await flue.skill('merge/resolve-conflicts.md', {
		args: { prNumber, branch },
		result: v.object({
			correct: v.pipe(
				v.boolean(),
				v.description('true if all conflict resolutions were correct or have been fixed'),
			),
			correctedFiles: v.pipe(
				v.array(v.string()),
				v.description('List of files that needed corrections after verification'),
			),
		}),
	});

	// Step 2: Remove stale changesets that were already released on main
	await flue.skill('merge/clean-changesets.md', {
		args: { prNumber },
		result: v.object({
			removedChangesets: v.pipe(
				v.array(v.string()),
				v.description('List of changeset files that were removed'),
			),
		}),
	});

	// Step 3: Run tests and fix failures
	const fixResult = await flue.skill('merge/fix-tests.md', {
		args: { prNumber },
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

	// Step 4: Commit and push all changes
	const status = await flue.shell('git status --porcelain');
	if (status.stdout.trim()) {
		await flue.shell('git add -A');

		const commitParts = [];
		if (verifyResult.correctedFiles.length > 0) commitParts.push('fix merge conflict resolutions');
		if (fixResult.fixedFiles.length > 0) commitParts.push('fix test failures');
		const commitMsg =
			commitParts.length > 0
				? `chore: ${commitParts.join(' and ')} for main-to-next merge`
				: 'chore: update main-to-next merge';

		await flue.shell(`git commit -m ${JSON.stringify(commitMsg)}`);
		const pushResult = await flue.shell(`git push origin ${branch}`);
		console.info('push result:', pushResult);

		if (pushResult.exitCode !== 0) {
			return { pushed: false, testsPass: fixResult.testsPass };
		}
	}

	// Step 5: Post a summary comment on the PR
	const summaryParts = [];
	if (verifyResult.correctedFiles.length > 0) {
		summaryParts.push(`- Fixed conflict resolutions in: ${verifyResult.correctedFiles.join(', ')}`);
	}
	if (fixResult.fixedFiles.length > 0) {
		summaryParts.push(`- Fixed test failures in: ${fixResult.fixedFiles.join(', ')}`);
	}
	if (fixResult.remainingFailures.length > 0) {
		summaryParts.push(
			`- ⚠️ Remaining failures that need manual attention: ${fixResult.remainingFailures.join(', ')}`,
		);
	}

	if (summaryParts.length > 0) {
		const commentBody = `## Automated Merge Fix

${summaryParts.join('\n')}

${fixResult.testsPass ? 'All tests pass — this PR should be ready for review.' : 'Some tests still fail — manual intervention may be needed.'}`;

		const token = process.env.FREDKBOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
		await fetch(`https://api.github.com/repos/withastro/astro/issues/${prNumber}/comments`, {
			method: 'POST',
			headers: {
				Authorization: `token ${token}`,
				'Content-Type': 'application/json',
				Accept: 'application/vnd.github+json',
			},
			body: JSON.stringify({ body: commentBody }),
		});
	}

	return {
		pushed: true,
		testsPass: fixResult.testsPass,
		correctedFiles: verifyResult.correctedFiles,
		remainingFailures: fixResult.remainingFailures,
	};
}
