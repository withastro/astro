import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { describe, it } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { promisify } from 'node:util';
import { exitOnEpipe, flushAndExit } from '../../../dist/cli/flush-and-exit.js';

const execFileAsync = promisify(execFile);

describe('astro check', () => {
	it('returns true (exit code 1) when @astrojs/check and typescript cannot be loaded', async () => {
		// Outside the monorepo, so neither package resolves from `root`.
		const root = await mkdtemp(join(tmpdir(), 'astro-check-missing-deps-'));
		const checkModule = new URL('../../../dist/cli/check/index.js', import.meta.url).href;
		// `ci-info` reads the environment once on import, so CI mode is set in a child
		// process. In CI mode `getPackage` returns undefined for missing packages
		// instead of prompting or installing them.
		const script = `
			const { check } = await import(${JSON.stringify(checkModule)});
			const result = await check({ _: [], root: ${JSON.stringify(root)}, silent: true });
			console.log(JSON.stringify(result));
		`;
		try {
			const { stdout } = await execFileAsync(
				process.execPath,
				['--input-type=module', '-e', script],
				{ env: { ...process.env, CI: 'true' } },
			);
			assert.equal(stdout.trim().split('\n').at(-1), 'true');
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});

/** A writable that holds each chunk until `release()` is called, like a pipe whose reader is slow. */
function createSlowStream() {
	const written: string[] = [];
	const pending: Array<() => void> = [];
	const stream = new Writable({
		highWaterMark: 1,
		write(chunk, _encoding, callback) {
			pending.push(() => {
				written.push(chunk.toString());
				callback();
			});
		},
	});
	const release = async () => {
		while (pending.length) {
			pending.shift()!();
			await new Promise((resolve) => setImmediate(resolve));
		}
	};
	return { stream, written, release };
}

describe('flushAndExit', () => {
	it('exits only after queued writes reach a slow stream', async () => {
		const out = createSlowStream();
		const err = createSlowStream();
		out.stream.write('diagnostics\n');
		out.stream.write('Result (1 file)\n');
		err.stream.write('warning\n');

		const exitCodes: number[] = [];
		const done = flushAndExit(1, [out.stream, err.stream], (code) => exitCodes.push(code));

		await new Promise((resolve) => setImmediate(resolve));
		assert.deepEqual(exitCodes, []);

		await Promise.all([out.release(), err.release()]);
		await done;
		assert.deepEqual(exitCodes, [1]);
		assert.equal(out.written.join(''), 'diagnostics\nResult (1 file)\n');
		assert.equal(err.written.join(''), 'warning\n');
	});

	it('exits when a stream has already been destroyed', async () => {
		const out = createSlowStream();
		out.stream.on('error', () => {});
		out.stream.destroy();

		const exitCodes: number[] = [];
		await flushAndExit(0, [out.stream], (code) => exitCodes.push(code));
		assert.deepEqual(exitCodes, [0]);
	});
});

describe('exitOnEpipe', () => {
	it('exits with code 1 on EPIPE and rethrows other errors', () => {
		const stream = new Writable({ write: (_chunk, _encoding, callback) => callback() });
		const exitCodes: number[] = [];
		exitOnEpipe([stream], (code) => exitCodes.push(code));

		const epipe = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' });
		assert.doesNotThrow(() => stream.emit('error', epipe));
		assert.deepEqual(exitCodes, [1]);

		const other = Object.assign(new Error('write EIO'), { code: 'EIO' });
		assert.throws(() => stream.emit('error', other), /EIO/);
	});

	it('ends a process that never finishes once its stdout reader closes', async () => {
		const flushModule = new URL('../../../dist/cli/flush-and-exit.js', import.meta.url).href;
		// Writes forever and keeps the event loop alive, like `astro check --watch`.
		const script = `
			const { exitOnEpipe } = await import(${JSON.stringify(flushModule)});
			exitOnEpipe();
			setInterval(() => process.stdout.write('x\\n'), 1);
		`;
		const child = spawn(process.execPath, ['--input-type=module', '-e', script], {
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		let stderr = '';
		child.stderr.on('data', (chunk) => (stderr += chunk));
		child.stdout.once('data', () => child.stdout.destroy());

		const timeout = setTimeout(() => child.kill(), 10_000);
		const [code, signal] = await new Promise<[number | null, string | null]>((resolve) =>
			child.on('exit', (c, s) => resolve([c, s])),
		);
		clearTimeout(timeout);
		assert.equal(signal, null);
		assert.equal(code, 1);
		assert.doesNotMatch(stderr, /EPIPE/);
	});
});
