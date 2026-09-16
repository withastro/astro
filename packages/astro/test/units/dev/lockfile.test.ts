import * as assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, before, describe, it } from 'node:test';
import {
	parseLockFile,
	serializeLockFile,
	evaluateExistingServer,
	killDevServer,
	writeLockFile,
	readLockFile,
	isProcessAlive,
	isAstroCommand,
	isLockFileProcessAlive,
	checkExistingServer,
	type LockFileData,
} from '../../../dist/core/dev/lockfile.js';

const validData: LockFileData = {
	pid: 12345,
	port: 4321,
	url: 'http://localhost:4321',
	background: false,
	startedAt: '2026-05-05T10:00:00.000Z',
};

// #region parseLockFile
describe('parseLockFile', () => {
	it('parses valid lock file JSON', () => {
		const content = JSON.stringify(validData);
		const result = parseLockFile(content);
		assert.deepEqual(result, validData);
	});

	it('returns null for invalid JSON', () => {
		assert.equal(parseLockFile('not json'), null);
	});

	it('returns null for empty string', () => {
		assert.equal(parseLockFile(''), null);
	});

	it('returns null when pid is missing', () => {
		const data = { ...validData, pid: undefined };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when pid is not a number', () => {
		const data = { ...validData, pid: 'abc' };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when port is missing', () => {
		const data = { ...validData, port: undefined };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when port is not a number', () => {
		const data = { ...validData, port: 'abc' };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when url is missing', () => {
		const data = { ...validData, url: undefined };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when url is not a string', () => {
		const data = { ...validData, url: 123 };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when background is missing', () => {
		const data = { ...validData, background: undefined };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when background is not a boolean', () => {
		const data = { ...validData, background: 'true' };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when startedAt is missing', () => {
		const data = { ...validData, startedAt: undefined };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when startedAt is not a string', () => {
		const data = { ...validData, startedAt: 123 };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null for an empty object', () => {
		assert.equal(parseLockFile('{}'), null);
	});

	it('returns null for an array', () => {
		assert.equal(parseLockFile('[]'), null);
	});

	it('preserves extra fields without error', () => {
		const data = { ...validData, extra: 'field' };
		const result = parseLockFile(JSON.stringify(data));
		assert.notEqual(result, null);
		assert.equal(result!.pid, validData.pid);
	});

	it('handles background: true', () => {
		const data = { ...validData, background: true };
		const result = parseLockFile(JSON.stringify(data));
		assert.notEqual(result, null);
		assert.equal(result!.background, true);
	});

	it('parses a valid urls field', () => {
		const data = {
			...validData,
			urls: {
				local: ['http://localhost:4321/'],
				network: ['http://192.168.1.30:4321/', 'http://100.96.45.51:4321/'],
			},
		};
		const result = parseLockFile(JSON.stringify(data));
		assert.notEqual(result, null);
		assert.deepEqual(result!.urls, data.urls);
	});

	it('parses successfully when urls is absent (backward compatible)', () => {
		const result = parseLockFile(JSON.stringify(validData));
		assert.notEqual(result, null);
		assert.equal(result!.urls, undefined);
	});

	it('returns null when urls is malformed', () => {
		const data = { ...validData, urls: { local: 'not-an-array', network: [] } };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when urls is missing the network array', () => {
		const data = { ...validData, urls: { local: ['http://localhost:4321/'] } };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});

	it('returns null when urls.network contains non-strings', () => {
		const data = { ...validData, urls: { local: [], network: [123] } };
		assert.equal(parseLockFile(JSON.stringify(data)), null);
	});
});
// #endregion

// #region serializeLockFile
describe('serializeLockFile', () => {
	it('produces valid JSON that round-trips through parseLockFile', () => {
		const serialized = serializeLockFile(validData);
		const parsed = parseLockFile(serialized);
		assert.deepEqual(parsed, validData);
	});

	it('uses tabs for indentation', () => {
		const serialized = serializeLockFile(validData);
		assert.ok(serialized.includes('\t'));
	});
});
// #endregion

// #region evaluateExistingServer
describe('evaluateExistingServer', () => {
	it('returns null when data is null', () => {
		assert.equal(evaluateExistingServer(null, false), null);
	});

	it('returns null when data is null even if alive is true', () => {
		assert.equal(evaluateExistingServer(null, true), null);
	});

	it('returns stale: false when process is alive', () => {
		const result = evaluateExistingServer(validData, true);
		assert.notEqual(result, null);
		assert.equal(result!.stale, false);
		assert.deepEqual(result!.data, validData);
	});

	it('returns stale: true when process is not alive', () => {
		const result = evaluateExistingServer(validData, false);
		assert.notEqual(result, null);
		assert.equal(result!.stale, true);
		assert.deepEqual(result!.data, validData);
	});
});
// #endregion

describe('isAstroCommand', () => {
	it('recognizes Astro CLI commands on Unix', () => {
		assert.equal(isAstroCommand('node /workspace/node_modules/astro/bin/astro.mjs dev'), true);
		assert.equal(isAstroCommand('node ./node_modules/.bin/astro preview'), true);
	});

	it('recognizes Astro CLI commands on Windows', () => {
		assert.equal(
			isAstroCommand(
				'"C:\\Program Files\\nodejs\\node.exe" "C:\\project\\node_modules\\astro\\bin\\astro.mjs" dev',
			),
			true,
		);
		assert.equal(
			isAstroCommand('cmd.exe /d /s /c "C:\\project\\node_modules\\.bin\\astro.cmd dev"'),
			true,
		);
	});

	it('does not mistake an unrelated command for Astro', () => {
		assert.equal(isAstroCommand('node /home/astro/server.mjs'), false);
		assert.equal(isAstroCommand('node /workspace/astronomy.mjs'), false);
		assert.equal(isAstroCommand('node ./astro.js'), false);
		assert.equal(isAstroCommand('npm run dev'), false);
	});
});

describe('isLockFileProcessAlive', () => {
	/** A long-lived child process whose PID is alive but is not the current process. */
	let child: ReturnType<typeof spawn>;
	let childPid: number;

	before(() => {
		child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 60_000)'], {
			stdio: 'ignore',
		});
		childPid = child.pid!;
	});

	after(() => {
		child.kill('SIGKILL');
	});

	it('returns false when the lock file PID matches the current process', async () => {
		const data = { ...validData, pid: process.pid };
		const findProcess = async () => [
			{
				pid: process.pid,
				ppid: process.ppid,
				name: 'node',
				cmd: 'node /workspace/node_modules/astro/bin/astro.mjs dev',
			},
		];

		assert.equal(await isLockFileProcessAlive(data, findProcess), false);
	});

	it('returns true when the recorded process command is Astro', async () => {
		const data = { ...validData, pid: childPid };
		const findProcess = async () => [
			{
				pid: childPid,
				ppid: process.pid,
				name: 'node',
				cmd: 'node /workspace/node_modules/astro/bin/astro.mjs dev',
			},
		];

		assert.equal(await isLockFileProcessAlive(data, findProcess), true);
	});

	it('returns false when the PID belongs to another command', async () => {
		const data = { ...validData, pid: childPid };
		const findProcess = async () => [
			{
				pid: childPid,
				ppid: process.pid,
				name: 'node',
				cmd: 'node /app/server.mjs',
			},
		];

		assert.equal(await isLockFileProcessAlive(data, findProcess), false);
	});

	it('keeps the PID-only result when the command cannot be inspected', async () => {
		const data = { ...validData, pid: childPid };

		assert.equal(await isLockFileProcessAlive(data, async () => []), true);
		assert.equal(
			await isLockFileProcessAlive(data, async () => {
				throw new Error('Process lookup failed');
			}),
			true,
		);
	});
});

describe('checkExistingServer', () => {
	let tempDir: string;
	let root: URL;

	before(() => {
		tempDir = mkdtempSync(join(tmpdir(), 'astro-lockfile-'));
		root = pathToFileURL(tempDir + '/');
	});

	after(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it('cleans up a lock file when a live PID belongs to another command', async () => {
		const data = { ...validData, pid: process.pid };
		writeLockFile(root, data);

		assert.equal(await checkExistingServer(root), null);
		assert.equal(readLockFile(root), null);
	});
});

// #region killDevServer
describe('killDevServer', () => {
	let tempDir: string;
	let root: URL;

	before(() => {
		tempDir = mkdtempSync(join(tmpdir(), 'astro-lockfile-'));
		root = pathToFileURL(tempDir + '/');
	});

	after(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it('removes the lock file when the process is already dead', async () => {
		// Use a PID that is very unlikely to be alive.
		const data: LockFileData = {
			...validData,
			pid: 999_999,
		};
		writeLockFile(root, data);
		assert.notEqual(readLockFile(root), null);

		await killDevServer(root, data);

		assert.equal(readLockFile(root), null);
	});

	it('kills a live process and removes the lock file', async () => {
		// Spawn a long-running child process.
		const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
			stdio: 'ignore',
		});
		const pid = child.pid!;
		// Wait until the child is confirmed alive.
		assert.equal(isProcessAlive(pid), true);

		const data: LockFileData = {
			...validData,
			pid,
		};
		writeLockFile(root, data);

		await killDevServer(root, data);

		assert.equal(isProcessAlive(pid), false);
		assert.equal(readLockFile(root), null);
	});
});
// #endregion
