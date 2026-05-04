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
	branch: v.string(),
	hasConflicts: v.boolean(),
});

export default async function mergeResolve(
	flue: FlueClient,
	{ branch, hasConflicts }: v.InferOutput<typeof args>,
) {
	// Step 1: Resolve all merge conflicts (source code, JSON, YAML, etc.)
	// The GitHub Action has already done `git merge origin/main`. If there were
	// conflicts, the working tree has conflict markers in all affected files.
	// This skill resolves them intelligently — keeping next-side versions but
	// preserving important changes from main (new deps, bug fixes, etc.)
	const resolveResult = await flue.skill('merge/resolve-conflicts.md', {
		args: { branch, hasConflicts },
		result: v.object({
			resolvedFiles: v.pipe(
				v.array(v.string()),
				v.description('List of files where conflicts were resolved'),
			),
		}),
	});

	// Step 2: Remove stale changesets that were already released on main
	const changesetResult = await flue.skill('merge/clean-changesets.md', {
		args: {},
		result: v.object({
			removedChangesets: v.pipe(
				v.array(v.string()),
				v.description('List of changeset files that were removed'),
			),
		}),
	});

	// Step 3: Regenerate the lockfile
	// This runs AFTER conflict resolution so the lockfile is generated from
	// correct package.json files (not ones with conflict markers).
	// We do NOT build here — the merge-fix workflow handles build/type/lint
	// errors if CI fails after this push.
	const installResult = await flue.shell('CI=true pnpm install --no-frozen-lockfile');
	if (installResult.exitCode !== 0) {
		return {
			success: false,
			error: 'pnpm install failed after conflict resolution',
			resolvedFiles: resolveResult.resolvedFiles,
			removedChangesets: changesetResult.removedChangesets,
		};
	}

	// Step 4: Commit and push
	// Include the lockfile and any build artifacts in the commit
	await flue.shell('git add -A');

	const commitParts = [];
	if (resolveResult.resolvedFiles.length > 0) commitParts.push('resolve merge conflicts');
	if (changesetResult.removedChangesets.length > 0) commitParts.push('clean stale changesets');
	const commitMsg =
		commitParts.length > 0
			? `chore: ${commitParts.join(' and ')} for main-to-next merge`
			: 'chore: merge main into next';

	await flue.shell(`git commit -m ${JSON.stringify(commitMsg)} --allow-empty`);
	const pushResult = await flue.shell(`git push -f origin ${branch}`);

	if (pushResult.exitCode !== 0) {
		return {
			success: false,
			error: 'git push failed',
			resolvedFiles: resolveResult.resolvedFiles,
			removedChangesets: changesetResult.removedChangesets,
		};
	}

	return {
		success: true,
		resolvedFiles: resolveResult.resolvedFiles,
		removedChangesets: changesetResult.removedChangesets,
	};
}
