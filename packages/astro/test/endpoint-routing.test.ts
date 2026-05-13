import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('endpoints', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/endpoint-routing/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should return a redirect response with location header', async () => {
		const res = await fixture.fetch('/response-redirect', { redirect: 'manual' });
		assert.equal(res.headers.get('location'), 'https://example.com/destination');
		assert.equal(res.headers.get('x-astro-reroute'), null);
		assert.equal(res.status, 307);
	});

	it('should return a response with location header', async () => {
		const res = await fixture.fetch('/response', { redirect: 'manual' });
		assert.equal(res.headers.get('location'), 'https://example.com/destination');
		assert.equal(res.status, 307);
	});

	it('should remove internally-used header for HTTP status 404', async () => {
		const res = await fixture.fetch('/not-found');
		assert.equal(res.headers.get('x-astro-reroute'), null);
		assert.equal(res.status, 404);
	});

	it('should remove internally-used header for HTTP status 500', async () => {
		const res = await fixture.fetch('/internal-error');
		assert.equal(res.headers.get('x-astro-reroute'), null);
		assert.equal(res.status, 500);
	});
});
