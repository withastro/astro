import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { loadFixture } from './test-utils.ts';

describe('astro:build:generated fires for pure-SSR builds', () => {
	let buildGeneratedFired = false;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/ssr-build-generated/',
			output: 'server',
			adapter: testAdapter(),
			integrations: [
				{
					name: 'test-build-generated',
					hooks: {
						'astro:build:generated': () => {
							buildGeneratedFired = true;
						},
					},
				},
			],
		});
		await fixture.build();
	});

	it('should fire astro:build:generated even with zero prerendered pages', () => {
		assert.equal(buildGeneratedFired, true, 'astro:build:generated should have fired');
	});
});
