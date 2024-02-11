import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/directory-mode/', import.meta.url);
describe('Directory mode', () => {
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');
	});

	it('generates functions folder inside the project root', () => {
		const testURL = new URL('functions', root);
		assert.equal(existsSync(fileURLToPath(testURL)), true);
	});

	it('generates functions file inside the project root', () => {
		const testURL = new URL('functions/[[path]].js', root);
		assert.equal(existsSync(fileURLToPath(testURL)), true);
	});

	it('generates a redirects file', () => {
		const testURL = new URL('dist/_redirects', root);
		try {
			const _redirects = readFileSync(fileURLToPath(testURL), 'utf-8');
			const parts = _redirects.split(/\s+/);
			assert.deepEqual(parts, ['/old', '/', '301']);
		} catch (e) {
			assert.equal(false, true);
		}
	});
});
