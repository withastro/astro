import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Chunks', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-prerender-chunks/',
		});
		await fixture.build();
	});

	it('does not have wrong chunks', async () => {
		const content = await fixture.readFile('_worker.js/renderers.mjs');
		const hasImportFromPrerender = !content.includes(`React } from './chunks/prerender`);
		assert.ok(hasImportFromPrerender);
	});
});
