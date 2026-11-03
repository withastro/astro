import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { describe, it } from 'node:test';

const exitModule = new URL('../../../dist/cli/exit.js', import.meta.url).href;
// Several times the 64 KiB pipe buffer, written in one synchronous loop.
const lines = 20_000;

/** Runs `exitCall` after printing `lines` lines, reading stdout only after a delay. */
function runSlowReader(exitCall: string): Promise<{ stdout: string; code: number | null }> {
	const script = `
		const { flushAndExit } = await import(${JSON.stringify(exitModule)});
		for (let i = 0; i < ${lines}; i++) console.info('line ' + i);
		${exitCall}
	`;
	const child = spawn(process.execPath, ['--input-type=module', '-e', script], {
		stdio: ['ignore', 'pipe', 'inherit'],
	});
	let stdout = '';

	child.stdout.pause();
	setTimeout(() => child.stdout.resume(), 500);
	child.stdout.on('data', (chunk) => {
		stdout += chunk;
	});

	return new Promise((resolve) => {
		child.on('close', (code) => resolve({ stdout, code }));
	});
}

describe('flushAndExit', () => {
	it('delivers every line to a slow pipe reader before exiting', async () => {
		const { stdout, code } = await runSlowReader('await flushAndExit(1);');

		assert.equal(stdout.trim().split('\n').at(-1), `line ${lines - 1}`);
		assert.equal(code, 1);
	});

	it('exits when the reader has closed the pipe (head)', async () => {
		const script = `
			const { flushAndExit } = await import(${JSON.stringify(exitModule)});
			for (let i = 0; i < ${lines}; i++) console.info('line ' + i);
			await flushAndExit(0);
		`;
		const child = spawn(process.execPath, ['--input-type=module', '-e', script], {
			stdio: ['ignore', 'pipe', 'ignore'],
		});

		child.stdout.once('data', () => child.stdout.destroy());
		const code = await new Promise((resolve) => child.on('close', resolve));

		assert.equal(code, 0);
	});
});
