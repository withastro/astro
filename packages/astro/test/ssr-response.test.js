import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Using Astro.response in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-response/',
			adapter: testAdapter(),
			experimental: {
				ssr: true,
			},
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

	it('Child component can set status', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/child-set-status');
		const response = await app.render(request);
		expect(response.status).to.equal(403);
	});

	it('Can add headers', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/some-header');
		const response = await app.render(request);
		const headers = response.headers;
		expect(headers.get('one-two')).to.equal('three');
		expect(headers.get('four-five')).to.equal('six');
		expect(headers.get('seven-eight')).to.equal('nine');
	});

	it('Child component cannot override headers object', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/child-tries-to-overwrite');
		const response = await app.render(request);
		const headers = response.headers;
		expect(headers.get('seven-eight')).to.equal('nine');
		const html = await response.text();
		const $ = cheerioLoad(html);
		expect($('#overwrite-error').html()).to.equal('true');
	});
});
