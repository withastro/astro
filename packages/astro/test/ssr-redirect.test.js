import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Astro.redirect', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-redirect/',
			output: 'server',
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

	it('Warns when used inside a component', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/late');
		const response = await app.render(request);
		try {
			const text = await response.text();
			expect(false).to.equal(true);
		} catch(e) {
			expect(e.message).to.equal('The response has already been sent to the browser and cannot be altered.');
		}
	});
});
