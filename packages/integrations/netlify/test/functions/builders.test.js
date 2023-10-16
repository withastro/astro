import { expect } from 'chai';
import { cli } from './test-utils.js';
import { fileURLToPath } from 'url';

const root = new URL('./fixtures/builders/', import.meta.url).toString();

describe('Builders', () => {
	before(async () => {
		await cli('build', '--root', fileURLToPath(root));
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
