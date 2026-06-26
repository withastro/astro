import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(execCb);

const REPO = process.env.GITHUB_REPOSITORY || 'withastro/astro';
export const GITHUB_TOKEN_BASE = process.env.GITHUB_TOKEN;

// Intentionally not exported, GITHUB_TOKEN_BASE should be enough anywhere else.
const GITHUB_TOKEN_PRIVILEGED = process.env.FREDKBOT_GITHUB_TOKEN;

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

/**
 * Push a branch to origin using the privileged token. Runs outside the sandbox
 * so the agent never sees the write-capable token.
 */
export async function gitPush(
	branch: string,
	options?: { force?: boolean },
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
	assert(GITHUB_TOKEN_PRIVILEGED, 'FREDKBOT_GITHUB_TOKEN token is required.');
	const forceFlag = options?.force ? ' -f' : '';
	const remoteUrl = `https://x-access-token:${GITHUB_TOKEN_PRIVILEGED}@github.com/${REPO}.git`;
	try {
		const { stdout, stderr } = await execAsync(`git push${forceFlag} ${remoteUrl} ${branch}`);
		return { exitCode: 0, stdout, stderr };
	} catch (err: any) {
		return { exitCode: err.code ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
	}
}
