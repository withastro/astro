import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../../astro/test/test-utils.js';
import netlifyAdapter from '../dist/index.js';
import { fileURLToPath } from 'url';

describe('Cookies', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/cookies/', import.meta.url).toString(),
			experimental: {
				ssr: true,
			},
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/cookies/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			vite: {
				resolve: {
					alias: {
						'@astrojs/netlify/netlify-functions.js': fileURLToPath(
							new URL('../dist/netlify-functions.js', import.meta.url)
						),
					},
				},
			},
		});
		await fixture.build();
	});

	it('Can set multiple', async () => {
		const entryURL = new URL('./fixtures/cookies/dist/functions/entry.mjs', import.meta.url);
		const { handler } = await import(entryURL);
		const resp = await handler({
			httpMethod: 'POST',
			headers: {},
			rawUrl: 'http://example.com/login',
			body: '{}',
			isBase64Encoded: false,
		});
		expect(resp.statusCode).to.equal(301);
		expect(resp.headers.location).to.equal('/');
		expect(resp.multiValueHeaders).to.be.deep.equal({
			'set-cookie': ['foo=foo; HttpOnly', 'bar=bar; HttpOnly'],
		});
	});
});
