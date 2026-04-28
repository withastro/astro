import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('Static build: pages routes have distURL', () => {
	let assets: Map<string, URL[]>;
	before(async () => {
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
		for (const [route, distURL] of assets.entries()) {
			assert.equal(
				distURL.length > 0,
				true,
				`Route "${route}" has an empty distURL array — asset URLs were not propagated to astro:build:done`,
			);
			for (const url of distURL) {
				assert.equal(url instanceof URL, true, `Route "${route}" distURL entry is not a URL`);
			}
		}
	});
});
