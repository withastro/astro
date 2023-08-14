// This is an extremely simplified version of [`execa`](https://github.com/sindresorhus/execa)
// intended to keep our dependency size down
import type { StdioOptions } from 'node:child_process';
import type { Readable } from 'node:stream';

import { spawn } from 'node:child_process';
import { text as textFromStream } from 'node:stream/consumers';
import { setTimeout as sleep } from 'node:timers/promises';

export interface ExecaOptions {
	cwd?: string | URL;
	stdio?: StdioOptions;
	timeout?: number;
}
export interface Output {
	stdout: string;
	stderr: string;
	exitCode: number;
}
const text = (stream: NodeJS.ReadableStream | Readable | null) =>
	stream ? textFromStream(stream).then((t) => t.trimEnd()) : '';

export async function shell(
	command: string,
	flags: string[],
	opts: ExecaOptions = {}
): Promise<Output> {
	const controller = opts.timeout ? new AbortController() : undefined;
	const child = spawn(command, flags, {
		cwd: opts.cwd,
		shell: true,
		stdio: opts.stdio,
		signal: controller?.signal,
	});
	const stdout = await text(child.stdout);
	const stderr = await text(child.stderr);
	if (opts.timeout) {
		sleep(opts.timeout).then(() => {
			controller!.abort();
			throw { stdout, stderr, exitCode: 1 };
		});
	}
	await new Promise((resolve) => child.on('exit', resolve));
	const { exitCode } = child;
	if (exitCode !== 0) {
		throw { stdout, stderr, exitCode };
	}
	return { stdout, stderr, exitCode };
}
