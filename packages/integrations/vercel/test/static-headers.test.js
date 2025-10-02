import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Static headers', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-headers',
		});
		await fixture.build();
	});

	it('CSP headers are added when CSP is enabled', async () => {
		const config = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		const routes = config.routes;

		const headers = routes.find((x) => x.src === '/').headers;

		assert.ok(headers['content-security-policy'], 'the index must have CSP headers');
		assert.ok(
			headers['content-security-policy'].includes('script-src'),
			'must contain the script-src directive because of the server island',
		);
	});
});
