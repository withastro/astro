import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { resolveStaticPath } from '../../dist/serve-static.js';

describe('resolveStaticPath', () => {
	let tmpRoot: string;
	let clientDir: string;

	before(() => {
		tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-test-'));
		clientDir = path.join(tmpRoot, 'client');
		fs.mkdirSync(clientDir);
		fs.mkdirSync(path.join(clientDir, 'assets'));
		fs.writeFileSync(path.join(clientDir, 'index.html'), '<h1>hello</h1>');
		fs.mkdirSync(path.join(tmpRoot, 'secret'));
	});

	after(() => {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	});

	it('detects a subdirectory within client root', () => {
		const result = resolveStaticPath(clientDir, '/assets');
		assert.equal(result.isDirectory, true);
	});

	it('returns false for a non-existent path', () => {
		const result = resolveStaticPath(clientDir, '/nope');
		assert.equal(result.isDirectory, false);
	});

	it('returns false for a sibling directory via ../', () => {
		const result = resolveStaticPath(clientDir, '/../secret');
		assert.equal(result.isDirectory, false);
	});

	it('returns false for the parent directory', () => {
		const result = resolveStaticPath(clientDir, '/..');
		assert.equal(result.isDirectory, false);
	});

	it('returns false for deep .. traversal', () => {
		const result = resolveStaticPath(clientDir, '/../../../../../../../usr');
		assert.equal(result.isDirectory, false);
	});

	it('returns false for .. traversal with trailing slash', () => {
		const result = resolveStaticPath(clientDir, '/../secret/');
		assert.equal(result.isDirectory, false);
	});

	it('detects the client root itself', () => {
		const result = resolveStaticPath(clientDir, '/');
		assert.equal(result.isDirectory, true);
	});
});
