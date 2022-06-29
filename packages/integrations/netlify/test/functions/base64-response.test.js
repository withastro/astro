import { expect } from 'chai';
import { loadFixture, testIntegration } from './test-utils.js';
import netlifyAdapter from '../../dist/index.js';

describe('Base64 Responses', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/base64-response/', import.meta.url).toString(),
			experimental: {
				ssr: true,
			},
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/base64-response/dist/', import.meta.url),
				binaryMediaTypes: ['font/otf'],
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
		});
		await fixture.build();
	});

	it('Can return base64 encoded strings', async () => {
		const entryURL = new URL(
			'./fixtures/base64-response/.netlify/functions-internal/entry.mjs',
			import.meta.url
		);
		const { handler } = await import(entryURL);
		const resp = await handler({
			httpMethod: 'GET',
			headers: {},
			rawUrl: 'http://example.com/image',
			body: '{}',
			isBase64Encoded: false,
		});
		expect(resp.statusCode, 'successful response').to.equal(200);
		expect(resp.isBase64Encoded, 'includes isBase64Encoded flag').to.be.true;

		const buffer = Buffer.from(resp.body, 'base64');
		expect(buffer.toString(), 'decoded base64 string matches').to.equal('base64 test string');
	});

	it('Can define custom binaryMediaTypes', async () => {
		const entryURL = new URL(
			'./fixtures/base64-response/.netlify/functions-internal/entry.mjs',
			import.meta.url
		);
		const { handler } = await import(entryURL);
		const resp = await handler({
			httpMethod: 'GET',
			headers: {},
			rawUrl: 'http://example.com/font',
			body: '{}',
			isBase64Encoded: false,
		});
		expect(resp.statusCode, 'successful response').to.equal(200);
		expect(resp.isBase64Encoded, 'includes isBase64Encoded flag').to.be.true;

		const buffer = Buffer.from(resp.body, 'base64');
		expect(buffer.toString(), 'decoded base64 string matches').to.equal('base64 test font');
	});
});
