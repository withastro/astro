import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, before } from 'node:test';
import * as assert from 'node:assert/strict';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/function-per-route/', import.meta.url);

describe('Function per Route', () => {
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');
	});

	it('generates functions folder inside the project root', () => {
		const testURL = new URL('functions', root);
		assert.equal(existsSync(fileURLToPath(testURL)), true);
	});

	it('generates functions bundles for each page', () => {
		assert.equal(existsSync(fileURLToPath(new URL('functions/index.js', root))), true);
		assert.equal(existsSync(fileURLToPath(new URL('functions/blog/cool.js', root))), true);
		assert.equal(existsSync(fileURLToPath(new URL('functions/blog/[post].js', root))), true);
		assert.equal(existsSync(fileURLToPath(new URL('functions/[person]/[car].js', root))), true);
		assert.equal(existsSync(fileURLToPath(new URL('functions/files/[[path]].js', root))), true);
		assert.equal(existsSync(fileURLToPath(new URL('functions/[language]/files/[[path]].js', root))), true);
		assert.equal(existsSync(fileURLToPath(new URL('functions/trpc/[trpc].js', root))), true);
		assert.equal(existsSync(fileURLToPath(new URL('functions/javascript.js', root))), true);
		assert.equal(existsSync(fileURLToPath(new URL('functions/test.json.js', root))), true);
	});

	it('generates html files for pre-rendered routes', () => {
		assert.equal(existsSync(fileURLToPath(new URL('dist/prerender/index.html', root))), true);
	});
});
