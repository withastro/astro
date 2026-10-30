import * as assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
import { stopExistingServer } from '../../../dist/cli/server.js';

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
		const findProcess = async () => ({
			pid: process.pid,
			ppid: process.ppid,
			name: 'node',
			command: 'node /workspace/node_modules/astro/bin/astro.mjs dev',
		});

		assert.equal(await isLockFileProcessAlive(data, findProcess), false);
	});

	it('returns true when the recorded process command is Astro', async () => {
		const data = { ...validData, pid: childPid };
		const findProcess = async () => ({
			pid: childPid,
			ppid: process.pid,
			name: 'node',
			command: 'node /workspace/node_modules/astro/bin/astro.mjs dev',
		});

		assert.equal(await isLockFileProcessAlive(data, findProcess), true);
	});

	it('returns false when the PID belongs to another command', async () => {
		const data = { ...validData, pid: childPid };
		const findProcess = async () => ({
			pid: childPid,
			ppid: process.pid,
			name: 'node',
			command: 'node /app/server.mjs',
		});

		assert.equal(await isLockFileProcessAlive(data, findProcess), false);
	});

	it('returns false when a successful process lookup finds no matching PID', async () => {
		const data = { ...validData, pid: childPid };

		assert.equal(
			await isLockFileProcessAlive(data, async (pid) => {
				assert.equal(pid, childPid);
				return undefined;
			}),
			false,
		);
	});

	it('keeps the PID-only result when the process command is unavailable', async () => {
		const data = { ...validData, pid: childPid };

		assert.equal(await isLockFileProcessAlive(data, async () => ({ pid: childPid })), true);
	});

	it('keeps the PID-only result when process inspection fails', async () => {
		const data = { ...validData, pid: childPid };

		assert.equal(
			await isLockFileProcessAlive(data, async () => {
				throw Object.assign(new Error('spawn ps ENOENT'), { code: 'ENOENT' });
			}),
			true,
		);
	});

	it('treats a Linux thread ID as stale without killing its owning process', {
		skip: process.platform !== 'linux',
	}, async () => {
		// Wait for Node to initialize at least one non-main thread in the child.
		let threadId: string | undefined;
		for (let attempt = 0; attempt < 100 && threadId === undefined; attempt++) {
			threadId = readdirSync(`/proc/${childPid}/task`).find((id) => id !== String(childPid));
			if (threadId === undefined) await new Promise((resolve) => setTimeout(resolve, 20));
		}
		assert.ok(threadId, 'expected the child process to have a non-main thread');
		const data = { ...validData, pid: Number(threadId) };
		assert.equal(isProcessAlive(data.pid), true);

		// Exercise the real tinyps lookup, not a stub returning undefined.
		assert.equal(await isLockFileProcessAlive(data), false);

		const tempDir = mkdtempSync(join(tmpdir(), 'astro-thread-lockfile-'));
		const root = pathToFileURL(tempDir + '/');
		try {
			writeLockFile(root, data);
			assert.equal(await checkExistingServer(root), null);
			assert.equal(readLockFile(root), null);
			assert.equal(isProcessAlive(childPid), true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
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

	it('keeps the lock file when signaling the live Astro process fails with EPERM', async (t) => {
		// A real process whose command matches the Astro CLI entry, so the tinyps identity check passes.
		const binDir = join(tempDir, 'node_modules', 'astro', 'bin');
		mkdirSync(binDir, { recursive: true });
		const astroBin = join(binDir, 'astro.mjs');
		writeFileSync(astroBin, 'setInterval(() => {}, 1000);');
		const child = spawn(process.execPath, [astroBin], { stdio: 'ignore' });
		const pid = child.pid!;
		t.after(() => child.kill());

		const kill = process.kill.bind(process);
		t.mock.method(process, 'kill', (target: number, signal?: string | number) => {
			if (target === pid && signal === 0) {
				throw Object.assign(new Error('kill EPERM'), { code: 'EPERM' });
			}
			return kill(target, signal);
		});

		const data = { ...validData, pid };
		writeLockFile(root, data);

		assert.deepEqual(await checkExistingServer(root), data);
		assert.deepEqual(readLockFile(root), data);
	});

	it('removes the lock file when the recorded process does not exist (ESRCH)', async (t) => {
		t.mock.method(process, 'kill', () => {
			throw Object.assign(new Error('kill ESRCH'), { code: 'ESRCH' });
		});

		writeLockFile(root, validData);

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

	it('keeps the lock file and throws when the process cannot be signaled (EPERM)', async (t) => {
		t.mock.method(process, 'kill', () => {
			throw Object.assign(new Error('kill EPERM'), { code: 'EPERM' });
		});

		writeLockFile(root, validData);

		await assert.rejects(killDevServer(root, validData), /permission denied/);
		assert.deepEqual(readLockFile(root), validData);
	});
});
// #endregion

// #region stopExistingServer
describe('stopExistingServer', () => {
	let tempDir: string;
	let root: URL;

	before(() => {
		tempDir = mkdtempSync(join(tmpdir(), 'astro-lockfile-'));
		root = pathToFileURL(tempDir + '/');
	});

	after(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it('keeps the lock file and throws when the process cannot be signaled (EPERM)', async (t) => {
		t.mock.method(process, 'kill', () => {
			throw Object.assign(new Error('kill EPERM'), { code: 'EPERM' });
		});

		writeLockFile(root, validData);

		await assert.rejects(stopExistingServer(root, 'dev', validData.pid), /permission denied/);
		assert.deepEqual(readLockFile(root), validData);
	});
});
// #endregion
