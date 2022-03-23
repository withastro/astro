import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

// Asset bundling
describe('API routes in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/ssr-api-route/',
			buildOptions: {
				experimentalSsr: true,
			},
			adapter: testAdapter()
		});
		await fixture.build();
	});

	it('Basic pages work', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		expect(html).to.not.be.empty;
	});

	it('Can load the API route too', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/food.json');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		expect(response.headers.get('Content-Type')).to.equal('application/json');
		expect(response.headers.get('Content-Length')).to.not.be.empty;
		const body = await response.json();
		expect(body.length).to.equal(3);
	});
});
