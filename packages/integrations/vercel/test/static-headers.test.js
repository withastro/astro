import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Static headers', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/static-headers' });
		await fixture.build();
	});

	it('CSP headers are added when CSP is enabled', async () => {
		const config = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		const headers = config.headers;

		const csp = headers
			.find((x) => x.source === '/')
			.headers.find((x) => x.key === 'Content-Security-Policy');

		assert.notEqual(csp, undefined, 'the index must have CSP headers');
		assert.ok(
			csp.value.includes('script-src'),
			'must contain the script-src directive because of the server island',
		);
	});
});
