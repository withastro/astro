import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, mock } from 'node:test';
import { fixWinEPERMSync } from '../../../dist/core/fs/index.js';

// The fallback is written for Windows, where clearing the read-only bit with
// chmod 0o666 is harmless. On POSIX that same chmod strips the execute bit
// from a directory and blocks traversal, so the chmod is stubbed out here to
// exercise the removal itself on every platform.
describe('fixWinEPERMSync', () => {
	afterEach(() => {
		mock.restoreAll();
	});

	it('removes a directory recursively', () => {
		mock.method(fs, 'chmodSync', () => {});
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-fs-'));
		const dir = path.join(root, 'dist');
		fs.mkdirSync(path.join(dir, 'nested'), { recursive: true });
		fs.writeFileSync(path.join(dir, 'nested', 'index.html'), '<html></html>');

		const eperm = Object.assign(new Error('EPERM'), { code: 'EPERM' });
		fixWinEPERMSync(dir, { recursive: true, force: true, maxRetries: 3 }, eperm);

		assert.equal(fs.existsSync(dir), false);
		fs.rmSync(root, { recursive: true, force: true });
	});

	it('removes a file', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-fs-'));
		const file = path.join(root, 'index.html');
		fs.writeFileSync(file, '<html></html>');

		const eperm = Object.assign(new Error('EPERM'), { code: 'EPERM' });
		fixWinEPERMSync(file, { recursive: true, force: true, maxRetries: 3 }, eperm);

		assert.equal(fs.existsSync(file), false);
		fs.rmSync(root, { recursive: true, force: true });
	});

	it('gives up quietly when the path is already gone', () => {
		const eperm = Object.assign(new Error('EPERM'), { code: 'EPERM' });
		assert.doesNotThrow(() =>
			fixWinEPERMSync(
				path.join(os.tmpdir(), 'astro-fs-missing'),
				{ recursive: true, force: true },
				eperm,
			),
		);
	});
});
