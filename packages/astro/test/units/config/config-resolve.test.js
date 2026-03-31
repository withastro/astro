import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveConfig, resolveRoot } from '../../../dist/core/config/index.js';

describe('resolveRoot', () => {
	it('returns the real filesystem path (normalizes case)', () => {
		// resolveRoot should return fs.realpathSync result, which normalizes
		// path casing on case-insensitive file systems (e.g. Windows).
		const root = resolveRoot();
		const expected = fs.realpathSync(process.cwd());
		assert.equal(root, expected);
	});

	it('resolves a URL to a real path', () => {
		const url = new URL('file:///tmp');
		const root = resolveRoot(url);
		// Should be a string, resolved via realpathSync
		assert.equal(typeof root, 'string');
		assert.ok(path.isAbsolute(root));
	});
});

describe('resolveConfig', () => {
	it('resolves relative inline root correctly', async () => {
		const { astroConfig } = await resolveConfig(
			{
				configFile: false,
				root: 'relative/path',
			},
			'dev',
		);
		const expectedRoot = path.join(process.cwd(), 'relative/path/');
		assert.equal(fileURLToPath(astroConfig.root), expectedRoot);
	});
});
