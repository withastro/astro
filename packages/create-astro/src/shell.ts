// This is an extremely simplified version of [`execa`](https://github.com/sindresorhus/execa)
// intended to keep our dependency size down
import type { ChildProcess, StdioOptions } from 'node:child_process';
import { spawn } from 'node:child_process';
import type { Readable } from 'node:stream';
import { text as textFromStream } from 'node:stream/consumers';

const WINDOWS_CMD_SHIMS = new Set(['npm', 'npx', 'pnpm', 'pnpx', 'yarn', 'yarnpkg', 'bun', 'bunx']);

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

function resolveCommand(command: string) {
	if (process.platform !== 'win32') return command;
	if (command.includes('/') || command.includes('\\') || command.includes('.')) return command;
	return WINDOWS_CMD_SHIMS.has(command.toLowerCase()) ? `${command}.cmd` : command;
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
		child = spawn(resolveCommand(command), flags, {
			cwd: opts.cwd,
			stdio: opts.stdio,
			timeout: opts.timeout,
		});
		const done = new Promise<void>((resolve, reject) => {
			child.once('error', reject);
			child.once('close', () => resolve());
		});
		[stdout, stderr] = await Promise.all([text(child.stdout), text(child.stderr), done]);
	} catch {
		throw { stdout, stderr, exitCode: 1 };
	}
	const { exitCode } = child;
	if (exitCode === null) {
		throw new Error('Timeout');
	}
	if (exitCode !== 0) {
		throw new Error(stderr);
	}
	return { stdout, stderr, exitCode };
}
