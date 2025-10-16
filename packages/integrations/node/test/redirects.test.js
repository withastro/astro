import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { loadFixture, waitServerListen } from './test-utils.js';

describe('Redirects', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/redirects/',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		const res = startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
		await fixture.clean();
	});

	function fetchEndpoint(url, options = {}) {
		return fetch(`http://${server.host}:${server.port}/${url}`, { ...options, redirect: 'manual' });
	}

	it('should redirect with default 301 status for simple redirects', async () => {
		const response = await fetchEndpoint('old-page');
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/new-page');
	});

	it('should redirect with custom 301 status', async () => {
		const response = await fetchEndpoint('old-page-301');
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/new-page-301');
	});

	it('should redirect with custom 302 status', async () => {
		const response = await fetchEndpoint('old-page-302');
		assert.equal(response.status, 302);
		assert.equal(response.headers.get('location'), '/new-page-302');
	});

	it('should handle dynamic redirects with parameters', async () => {
		const response = await fetchEndpoint('dynamic/test-slug');
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/pages/test-slug');
	});

	it('should handle spread redirects with parameters', async () => {
		const response = await fetchEndpoint('spread/some/nested/path');
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/content/some/nested/path');
	});

	it('should redirect to external URL', async () => {
		const response = await fetchEndpoint('external');
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), 'https://example.com/');
	});
});
