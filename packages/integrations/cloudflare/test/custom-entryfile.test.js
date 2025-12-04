import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadFixture } from './_test-utils.js';

const root = new URL('./fixtures/custom-entryfile/', import.meta.url);

describe('Custom entry file', { skip: "This test hangs when is run, even with node", todo: "Resolve test hanging"}, () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-entryfile/',
		});
		await fixture.build();
	});
	
	after(async () => {
		await fixture.clean();
	})

	it('filters out duplicate "default" export and builds', async () => {
		const filePath = fileURLToPath(new URL('dist/_worker.js', root));
		const hasBuilt = existsSync(filePath);
		assert.equal(hasBuilt, true, `Expected ${filePath} to exist after build`);
	});
});
