import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from '../../../../astro/test/test-utils.js';

describe('Static headers', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/static-headers/', import.meta.url) });
		await fixture.build();
	});

	it('CSP headers are added when CSP is enabled', async () => {
		const config = await fixture.readFile('../.netlify/v1/config.json');
		const headers = JSON.parse(config).headers;
		const index = headers.find((x) => x.for === '/');

		assert.notEqual(index, undefined, 'the index must have CSP headers');
		assert.notEqual(
			index.values['Content-Security-Policy'],
			undefined,
			'the index must have CSP headers',
		);
		assert.ok(
			index.values['Content-Security-Policy'].includes('script-src'),
			'must contain the script-src directive because of the server island',
		);
	});
});

describe('Static headers - collapsed CSP', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/static-headers-collapsed/', import.meta.url),
		});
		await fixture.build();
	});

	it('CSP headers are collapsed to single catch-all route when collapseHeaders is enabled', async () => {
		const config = await fixture.readFile('../.netlify/v1/config.json');
		const headers = JSON.parse(config).headers;
		const globalCspHeader = headers.find(
			(x) => x.for === '/(.*)' && x.values['Content-Security-Policy'],
		);

		assert.notEqual(globalCspHeader, undefined, 'should have global CSP header');
		assert.ok(
			typeof globalCspHeader.values['Content-Security-Policy'] === 'string',
			'should have CSP header string',
		);
	});

	it('CSP headers create exactly one entry when collapsed', async () => {
		const config = await fixture.readFile('../.netlify/v1/config.json');
		const headers = JSON.parse(config).headers;
		const cspHeaders = headers.filter((x) => x.values['Content-Security-Policy']);

		assert.equal(cspHeaders.length, 1, 'should have exactly one CSP header entry');
	});
});
