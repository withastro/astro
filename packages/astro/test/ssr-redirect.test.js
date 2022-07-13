import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Astro.redirect', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-redirect/',
			experimental: {
				ssr: true,
			},
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Returns a 302 status', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/secret');
		const response = await app.render(request);
		expect(response.status).to.equal(302);
		expect(response.headers.get('location')).to.equal('/login');
	});
});
