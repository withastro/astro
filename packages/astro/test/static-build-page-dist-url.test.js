import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Static build: pages routes have distURL', () => {
	/** @type {Map<string, URL[]>} */
	let assets;
	before(async () => {
		/** @type {import('./test-utils').Fixture} */
		const fixture = await loadFixture({
			root: './fixtures/astro pages/',
			integrations: [
				{
					name: '@astrojs/distURL',
					hooks: {
						'astro:build:done': (params) => {
							assets = params.assets;
						},
					},
				},
			],
		});
		await fixture.build();
	});
	it('Pages routes have distURL', async () => {
		assert.equal(assets.size > 0, true, 'Pages not found: build end hook not being called');
		for (const [p, distURL] of assets.entries()) {
			for (const url of distURL) {
				assert.equal(url instanceof URL, true, `${p.pathname} doesn't include distURL`);
			}
		}
	});
});
