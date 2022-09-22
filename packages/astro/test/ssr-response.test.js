import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Using Astro.response in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-response/',
			adapter: testAdapter(),
			output: 'server',
		});
		await fixture.build();
	});

	it('Can set the status', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		expect(response.status).to.equal(404);
	});

	it('Can set the statusText', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/status-code');
		const response = await app.render(request);
		expect(response.statusText).to.equal('Oops');
	});

	it('Can add headers', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/some-header');
		const response = await app.render(request);
		const headers = response.headers;
		expect(headers.get('one-two')).to.equal('three');
		expect(headers.get('four-five')).to.equal('six');
	});
});
