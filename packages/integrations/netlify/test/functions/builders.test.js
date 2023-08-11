import { expect } from 'chai';
import { loadFixture, testIntegration } from './test-utils.js';
import netlifyAdapter from '../../dist/index.js';

describe('Builders', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/builders/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/builders/dist/', import.meta.url),
                builders: true
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
		});
		await fixture.build();
	});

	it('A route can set builders ttl', async () => {
		const entryURL = new URL(
			'./fixtures/builders/.netlify/functions-internal/entry.mjs',
			import.meta.url
		);
		const { handler } = await import(entryURL);
		const resp = await handler({
			httpMethod: 'GET',
			headers: {},
			rawUrl: 'http://example.com/',
			isBase64Encoded: false,
		});
		expect(resp.ttl).to.equal(45);
	});
});
