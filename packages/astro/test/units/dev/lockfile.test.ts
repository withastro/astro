import * as assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { after, before, describe, it } from 'node:test';
import {
	parseLockFile,
	serializeLockFile,
	evaluateExistingServer,
	checkExistingServer,
	killDevServer,
	writeLockFile,
	readLockFile,
	isProcessAlive,
	getProcessStartTime,
	type LockFileData,
} from '../../../dist/core/dev/lockfile.js';

const validData: LockFileData = {
	pid: 12345,
	port: 4321,
	url: 'http://localhost:4321',
	background: false,
	startedAt: '2026-05-05T10:00:00.000Z',
};

// Process identity via /proc is only available on Linux.
const isLinux = process.platform === 'linux';

// Write a lock file exactly as given, without the start-time stamping that
// writeLockFile applies to live PIDs — simulates files written by another
// container or astro version.
function writeRawLockFile(root: URL, data: LockFileData): void {
	const dir = join(fileURLToPath(root), '.astro');
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'dev.json'), serializeLockFile(data), 'utf-8');
}

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

	it('parses a valid pidStartTime field', () => {
		const data = { ...validData, pidStartTime: '38462841' };
		const result = parseLockFile(JSON.stringify(data));
		assert.notEqual(result, null);
		assert.equal(result!.pidStartTime, '38462841');
	});

	it('returns null when pidStartTime is not a string', () => {
		const data = { ...validData, pidStartTime: 38462841 };
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

// #region getProcessStartTime
describe('getProcessStartTime', () => {
	it('returns the kernel start time of a live process', { skip: !isLinux }, () => {
		const startTime = getProcessStartTime(process.pid);
		assert.match(startTime!, /^\d+$/);
	});

	it('returns undefined for a process that does not exist', () => {
		assert.equal(getProcessStartTime(999_999), undefined);
	});
});
// #endregion

// #region writeLockFile
describe('writeLockFile', () => {
	let tempDir: string;
	let root: URL;

	before(() => {
		tempDir = mkdtempSync(join(tmpdir(), 'astro-lockfile-'));
		root = pathToFileURL(tempDir + '/');
	});

	after(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it('records the start time of the recorded PID when available', { skip: !isLinux }, () => {
		const data: LockFileData = { ...validData, pid: process.pid };
		writeLockFile(root, data);

		const written = readLockFile(root);
		assert.notEqual(written, null);
		assert.equal(written!.pidStartTime, getProcessStartTime(process.pid));
	});

	it('omits the start time when it cannot be determined', async () => {
		// A process that already exited has no readable start time.
		const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
		await new Promise((resolve) => child.on('exit', resolve));

		writeLockFile(root, { ...validData, pid: child.pid! });

		const written = readLockFile(root);
		assert.notEqual(written, null);
		assert.equal(written!.pidStartTime, undefined);
	});
});
// #endregion

// #region checkExistingServer
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

	it('treats the lock file as stale when the PID was reused by a different process', {
		skip: !isLinux,
	}, () => {
		// Simulates the Docker container restart scenario from
		// https://github.com/withastro/astro/issues/17656: the lock file persists on a
		// volume mount, and the recorded PID is now used by an unrelated process.
		const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
			stdio: 'ignore',
		});
		try {
			const data: LockFileData = {
				...validData,
				pid: child.pid!,
				// A start time that cannot match the reused process, as if the lock file
				// was written by a previous container.
				pidStartTime: '1',
			};
			writeRawLockFile(root, data);

			assert.equal(checkExistingServer(root), null);
			// The stale lock file is cleaned up so a new server can start.
			assert.equal(readLockFile(root), null);
		} finally {
			child.kill();
		}
	});

	it('returns the lock data when the recorded process still matches', { skip: !isLinux }, () => {
		const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
			stdio: 'ignore',
		});
		try {
			const data: LockFileData = {
				...validData,
				pid: child.pid!,
				pidStartTime: getProcessStartTime(child.pid!)!,
			};
			writeLockFile(root, data);

			assert.deepEqual(checkExistingServer(root), data);
		} finally {
			child.kill();
		}
	});

	it('treats a legacy lock file as stale when its process started after it was written', {
		skip: !isLinux,
	}, () => {
		// Lock files written before process identity tracking carry no recorded start
		// time. After a Docker container restart the reused PID belongs to a process
		// that started after the lock file was written.
		const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
			stdio: 'ignore',
		});
		try {
			const data: LockFileData = {
				...validData,
				pid: child.pid!,
			};
			writeRawLockFile(root, data);
			// Age the lock file so it predates the reused process.
			const past = new Date(Date.now() - 3_600_000);
			utimesSync(join(tempDir, '.astro', 'dev.json'), past, past);

			assert.equal(checkExistingServer(root), null);
			assert.equal(readLockFile(root), null);
		} finally {
			child.kill();
		}
	});

	it('returns the lock data for a legacy lock file whose process predates it', () => {
		// This test runner started well before the lock file is written.
		const data: LockFileData = {
			...validData,
			pid: process.pid,
		};
		writeRawLockFile(root, data);

		assert.deepEqual(checkExistingServer(root), data);
	});

	it('treats a legacy lock file as alive when its process started within the margin', {
		skip: !isLinux,
	}, () => {
		// The process start time and file mtime come from soft clocks, so a legacy lock
		// file is only stale when the recorded process clearly started after the write.
		const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
			stdio: 'ignore',
		});
		try {
			const data: LockFileData = {
				...validData,
				pid: child.pid!,
			};
			writeRawLockFile(root, data);
			// Age the lock file by less than the stale margin, so its mtime is only
			// slightly before the recorded process started.
			const recent = new Date(Date.now() - 2_000);
			utimesSync(join(tempDir, '.astro', 'dev.json'), recent, recent);

			assert.deepEqual(checkExistingServer(root), data);
		} finally {
			child.kill();
		}
	});
});
// #endregion

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
