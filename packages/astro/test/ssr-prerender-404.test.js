import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from '../dist/testing/ssr-adapter.js';

describe('SSR: prerender 404', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/ssr-prerender-404/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
			experimental: {
				prerender: true,
			},
		});
		await fixture.build();
	});

	describe('Prerendering', () => {
		it('Prerendered 404.astro page is not rendered', async () => {
			const { app } = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/non-existent-page');
			const response = await app.render(request);
			expect(response.status).to.equal(404);
			expect(response.statusText).to.equal(
				'Not found',
				'should be actual 404 response, not 404 page'
			);
		});
	});
});
