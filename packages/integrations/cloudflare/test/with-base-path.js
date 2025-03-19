// @ts-check
import * as assert from 'node:assert/strict';
import { promises as fs, existsSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/with-base/', import.meta.url);

describe('With base', () => {
	before(async () => {
		await fs.rm(new URL('dist/', root), { recursive: true, force: true });
		await astroCli(fileURLToPath(root), 'build');
	});

	it('generates platform files in the correct directory', async () => {
		for (const file of ['_redirects', '_routes.json', 'blog/static/index.html']) {
			assert.ok(existsSync(new URL(`dist/${file}`, root)));
		}
	});
});
