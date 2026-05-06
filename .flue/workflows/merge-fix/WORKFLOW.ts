import type { FlueContext } from '@flue/sdk/client';
import { defineCommand } from '@flue/sdk/node';
import * as v from 'valibot';
import { fetchCIFailureLogs, postPRComment } from './github.ts';

// CLI-only agent: no HTTP trigger. Invoked from GitHub Actions via `flue run merge-fix`.
export const triggers = {};

const GITHUB_TOKEN = process.env.FREDKBOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '';
const gh = defineCommand('gh', { env: { GH_TOKEN: GITHUB_TOKEN } });
const git = defineCommand('git');
const gitWithAuth = defineCommand('git', { env: { GH_TOKEN: GITHUB_TOKEN } });
const pnpm = defineCommand('pnpm');
const node = defineCommand('node');

export const args = v.object({
	prNumber: v.number(),
});

export default async function mergeFix({ init, payload }: FlueContext) {
	const prNumber = payload.prNumber as number;
	const branch = 'ci/merge-main-to-next';

	const agent = await init({
		sandbox: 'local',
		model: 'anthropic/claude-opus-4-6',
	});
	const session = await agent.session();

	// Step 1: Fetch CI failure logs before entering the sandbox.
	// The gh CLI doesn't work inside the Flue sandbox (auth goes through a proxy),
	// so we fetch logs here in the orchestrator and pass them to the skill.
	const ciLogs = await fetchCIFailureLogs(branch);

	// Step 2: Verify conflict resolutions and resolve any remaining source code conflicts.
	// JSON/YAML conflicts were pre-stripped by the GitHub Action (keeping next side).
	// This skill checks that nothing important from main was lost, and resolves
	// any remaining conflict markers in .ts/.js/.md/.astro files.
	const verifyResult = await session.skill('merge/resolve-conflicts.md', {
		args: { prNumber, branch },
		commands: [gh, git, pnpm, node],
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

	// Step 3: Remove stale changesets that were already released on main
	await session.skill('merge/clean-changesets.md', {
		args: { prNumber },
		commands: [gh, git, pnpm, node],
		result: v.object({
			removedChangesets: v.pipe(
				v.array(v.string()),
				v.description('List of changeset files that were removed'),
			),
		}),
	});

	// Step 4: Fix test failures using CI logs
	const fixResult = await session.skill('merge/fix-tests.md', {
		args: { prNumber, ciLogs },
		commands: [gh, git, pnpm, node],
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

	// Step 5: Commit and push all changes
	const status = await session.shell('git status --porcelain', { commands: [git] });
	if (status.stdout.trim()) {
		await session.shell('git add -A', { commands: [git] });

		const commitParts = [];
		if (verifyResult.correctedFiles.length > 0) commitParts.push('fix merge conflict resolutions');
		if (fixResult.fixedFiles.length > 0) commitParts.push('fix test failures');
		const commitMsg =
			commitParts.length > 0
				? `chore: ${commitParts.join(' and ')} for main-to-next merge`
				: 'chore: update main-to-next merge';

		await session.shell(`git commit -m ${JSON.stringify(commitMsg)}`, { commands: [git] });
		const pushResult = await session.shell(`git push origin ${branch}`, {
			commands: [gitWithAuth],
		});
		console.info('push result:', pushResult);

		if (pushResult.exitCode !== 0) {
			return { pushed: false, testsPass: fixResult.testsPass };
		}
	}

	// Step 6: Post a summary comment on the PR
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

		await postPRComment(prNumber, commentBody);
	}

	return {
		pushed: true,
		testsPass: fixResult.testsPass,
		correctedFiles: verifyResult.correctedFiles,
		remainingFailures: fixResult.remainingFailures,
	};
}
