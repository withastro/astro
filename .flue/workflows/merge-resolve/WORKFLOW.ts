import { createAgent, type FlueContext } from '@flue/runtime';
import { local } from '@flue/runtime/node';
import * as v from 'valibot';
import { GITHUB_TOKEN_BASE, gitPush } from '../../lib/github.ts';

export const args = v.object({
	branch: v.string(),
	hasConflicts: v.boolean(),
});

const agent = createAgent(() => ({
	sandbox: local({
		env: {
			// Read-only token for gh CLI reads inside the sandbox.
			// Write operations (git push) go through the orchestrator.
			GH_TOKEN: GITHUB_TOKEN_BASE,
		},
	}),
	model: 'anthropic/claude-opus-4-6',
}));

export async function run({ init, payload }: FlueContext) {
	const branch = payload.branch as string;
	const hasConflicts = payload.hasConflicts as boolean;

	const harness = await init(agent);
	const session = await harness.session();

	// Step 1: Resolve all merge conflicts (source code, JSON, YAML, etc.)
	// The GitHub Action has already done `git merge origin/main`. If there were
	// conflicts, the working tree has conflict markers in all affected files.
	// This skill resolves them intelligently — keeping next-side versions but
	// preserving important changes from main (new deps, bug fixes, etc.)
	const { data: resolveResult } = await session.skill('merge/resolve-conflicts.md', {
		args: { branch, hasConflicts },
		result: v.object({
			resolvedFiles: v.pipe(
				v.array(v.string()),
				v.description('List of files where conflicts were resolved'),
			),
		}),
	});

	// Step 2: Remove stale changesets that were already released on main
	const { data: changesetResult } = await session.skill('merge/clean-changesets.md', {
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
	const installResult = await session.shell('CI=true pnpm install --no-frozen-lockfile');
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
	await session.shell('git add -A');

	const commitParts = [];
	if (resolveResult.resolvedFiles.length > 0) commitParts.push('resolve merge conflicts');
	if (changesetResult.removedChangesets.length > 0) commitParts.push('clean stale changesets');
	const commitMsg =
		commitParts.length > 0
			? `chore: ${commitParts.join(' and ')} for main-to-next merge`
			: 'chore: merge main into next';

	await session.shell(`git commit -m ${JSON.stringify(commitMsg)} --allow-empty`);
	const pushResult = await gitPush(branch, { force: true });

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
