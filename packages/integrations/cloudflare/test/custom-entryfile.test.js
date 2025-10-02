import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/custom-entryfile/', import.meta.url);

describe('Custom entry file', () => {
	it('filters out duplicate "default" export and builds', async () => {
		await astroCli(fileURLToPath(root), 'build');
		const filePath = fileURLToPath(new URL('dist/_worker.js', root));
		const hasBuilt = existsSync(filePath);
		assert.equal(hasBuilt, true, `Expected ${filePath} to exist after build`);
	});
});
