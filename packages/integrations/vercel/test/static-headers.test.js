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

describe('Static headers - collapsed CSP', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-headers-collapsed',
		});
		await fixture.build();
	});

	it('CSP headers are collapsed to single catch-all route when collapseHeaders is enabled', async () => {
		const config = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		const globalCspRoute = config.routes.find(
			(r) => r.src === '/(.*)' && r.headers && r.headers['content-security-policy'],
		);

		assert.ok(globalCspRoute, 'should have global CSP route');
		assert.ok(
			typeof globalCspRoute.headers['content-security-policy'] === 'string',
			'should have CSP header string',
		);
	});

	it('CSP headers create exactly one entry when collapsed', async () => {
		const config = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		const cspRoutes = config.routes.filter(
			(r) => r.headers && r.headers['content-security-policy'],
		);

		assert.equal(cspRoutes.length, 1, 'should have exactly one CSP route entry');
	});
});
