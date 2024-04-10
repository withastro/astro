import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Chunks', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixtureServerless;

	before(async () => {
		fixtureServerless = await loadFixture({
			root: './fixtures/ssr-prerender-chunks/',
		});
		await fixtureServerless.build();
	});
	it('has wrong chunks', async () => {
		const content = await fixtureServerless.readFile('_worker.js/renderers.mjs')
		const hasImportFromPrerender = !content.includes(`React } from './chunks/prerender`)
		assert.ok(hasImportFromPrerender)
	})
})
