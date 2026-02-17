import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('SSR renderers with static framework pages', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-renderers-static-vue/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('does not include SSR renderers when only endpoints are dynamic', async () => {
		const app = await fixture.loadTestAdapterApp();
		assert.ok(app.manifest, 'expected runtime manifest from SSR build');
		assert.equal(app.manifest.renderers.length, 0);
	});

	it('prerendered page renders the Vue component', async () => {
		const html = await fixture.readFile('/client/index.html');
		assert.ok(html.includes('Hello from Vue'));
	});
});
