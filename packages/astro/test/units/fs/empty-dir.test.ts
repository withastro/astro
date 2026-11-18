import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it, mock } from 'node:test';
import { pathToFileURL } from 'node:url';
import { createFixture } from '../test-utils.ts';

describe('emptyDir', () => {
	const originalPlatform = process.platform;

	before(() => {
		Object.defineProperty(process, 'platform', { value: 'win32' });
	});

	after(() => {
		Object.defineProperty(process, 'platform', { value: originalPlatform });
		mock.restoreAll();
	});

	it('removes a directory recursively when fs.rmSync fails with EPERM on Windows', async () => {
		// `isWindows` is evaluated at module load, so import a fresh copy while `process.platform` is faked.
		const { emptyDir } = await import(`../../../dist/core/fs/index.js?win32=${Date.now()}`);

		const fixture = await createFixture({
			'/dist/_astro/nested/file.txt': 'x',
			'/dist/index.html': 'x',
		});
		const distDir = pathToFileURL(`${fixture.getPath('dist')}/`);

		const realRmSync = fs.rmSync;
		let failed = false;
		mock.method(fs, 'rmSync', (p: fs.PathLike, options?: fs.RmOptions) => {
			if (!failed) {
				failed = true;
				throw Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' });
			}
			return realRmSync(p, options);
		});
		// On POSIX, `chmodSync(dir, 0o666)` drops the execute bit and makes the directory untraversable;
		// on Windows it only toggles the read-only flag, so skip it to mirror Windows behavior.
		mock.method(fs, 'chmodSync', () => {});
		// Node.js 25+ throws when `fs.rmdirSync` receives `recursive`.
		const realRmdirSync = fs.rmdirSync;
		mock.method(fs, 'rmdirSync', (p: fs.PathLike, options?: { recursive?: boolean }) => {
			if (options && 'recursive' in options) {
				throw new TypeError("The property 'options.recursive' is no longer supported.");
			}
			return realRmdirSync(p);
		});

		emptyDir(distDir);

		assert.equal(failed, true);
		assert.deepEqual(fs.readdirSync(distDir), []);

		await fixture.rm();
	});
});
