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

	// Fetch CI failure logs before entering the sandbox.
	// The gh CLI doesn't work inside the Flue sandbox (auth goes through a proxy),
	// so we fetch logs here in the orchestrator and pass them to the skill.
	const ciLogs = await fetchCIFailureLogs(branch);

	// Fix CI failures: build errors, type errors, lint errors, and test failures.
	// Conflicts have already been resolved by the merge-resolve workflow.
	// Dependencies are installed but packages may NOT be built yet — the skill
	// handles building and fixing any errors that come up.
	const fixResult = await session.skill('merge/fix-ci.md', {
		args: { prNumber, ciLogs },
		commands: [gh, git, pnpm, node],
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
	const status = await session.shell('git status --porcelain', { commands: [git] });
	if (status.stdout.trim()) {
		await session.shell('git add -A', { commands: [git] });
		await session.shell('git commit -m "chore: fix CI failures for main-to-next merge"', {
			commands: [git],
		});
		const pushResult = await session.shell(`git push origin ${branch}`, {
			commands: [gitWithAuth],
		});
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
