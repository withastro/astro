// This is an extremely simplified version of [`execa`](https://github.com/sindresorhus/execa)
// intended to keep our dependency size down
import type { ChildProcess, StdioOptions } from 'node:child_process';
import { spawn } from 'node:child_process';
import type { Readable } from 'node:stream';
import { text as textFromStream } from 'node:stream/consumers';

const WINDOWS_CMD_SHIMS = new Set(['npm', 'npx', 'pnpm', 'pnpx', 'yarn', 'yarnpkg']);
// Bun ships as .exe on Windows, not .cmd, so it can be spawned directly with the .exe extension
const WINDOWS_EXE_SHIMS = new Set(['bun', 'bunx']);

interface ExecaOptions {
	cwd?: string | URL;
	stdio?: StdioOptions;
	timeout?: number;
}
interface Output {
	stdout: string;
	stderr: string;
	exitCode: number;
}
const text = (stream: NodeJS.ReadableStream | Readable | null) =>
	stream ? textFromStream(stream).then((t) => t.trimEnd()) : '';

/**
 * On Windows, `.cmd` and `.bat` files cannot be spawned directly without a shell.
 * For known package manager shims, we invoke them via `cmd.exe /d /s /c` instead.
 * Bun ships as `.exe` on Windows (not `.cmd`), so it can be spawned directly.
 * Returns [resolvedCommand, resolvedFlags] to use with spawn.
 */
function resolveCommand(command: string, flags: string[]): [string, string[]] {
	if (process.platform !== 'win32') return [command, flags];
	if (command.includes('/') || command.includes('\\') || command.includes('.'))
		return [command, flags];
	const cmd = command.toLowerCase();
	if (WINDOWS_CMD_SHIMS.has(cmd)) {
		return ['cmd.exe', ['/d', '/s', '/c', `${command}.cmd`, ...flags]];
	}
	if (WINDOWS_EXE_SHIMS.has(cmd)) {
		return [`${command}.exe`, flags];
	}
	return [command, flags];
}

export async function shell(
	command: string,
	flags: string[],
	opts: ExecaOptions = {},
): Promise<Output> {
	let child: ChildProcess;
	let stdout = '';
	let stderr = '';
	try {
		const [resolvedCommand, resolvedFlags] = resolveCommand(command, flags);
		child = spawn(resolvedCommand, resolvedFlags, {
			cwd: opts.cwd,
			stdio: opts.stdio,
			timeout: opts.timeout,
		});
		const done = new Promise<void>((resolve, reject) => {
			child.once('error', reject);
			child.once('close', () => resolve());
		});
		[stdout, stderr] = await Promise.all([text(child.stdout), text(child.stderr), done]);
	} catch (e) {
		const message = e instanceof Error ? e.message : stderr || 'Unknown error';
		throw new Error(message);
	}
	const { exitCode } = child;
	if (exitCode === null) {
		throw new Error('Timeout');
	}
	if (exitCode !== 0) {
		throw new Error(stderr || `Process exited with code ${exitCode}`);
	}
	return { stdout, stderr, exitCode };
}
