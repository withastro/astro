// Test file for middleware with static pages
// packages/integrations/node/test/middleware-static-pages.test.js

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { loadFixture, waitServerListen } from './test-utils.js';

describe('Middleware for static pages', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-static/',
			output: 'hybrid',
			adapter: nodejs({
				mode: 'standalone',
				runMiddlewareForStaticPages: true, // Enable the feature
			}),
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

	describe('Middleware execution', () => {
		it('should run middleware for prerendered HTML pages', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/static-page`);
			// Check for header added by middleware
			assert.ok(res.headers.get('x-middleware-ran'));
			assert.equal(res.headers.get('x-middleware-ran'), 'true');
		});

		it('should have access to cookies in middleware', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/static-page`, {
				headers: {
					cookie: 'test-cookie=test-value',
				},
			});
			// Middleware should have read the cookie and added it to response
			assert.ok(res.headers.get('x-cookie-value'));
			assert.equal(res.headers.get('x-cookie-value'), 'test-value');
		});

		it('should have access to headers in middleware', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/static-page`, {
				headers: {
					'user-agent': 'test-agent',
				},
			});
			// Check if middleware processed the header
			assert.ok(res.headers.get('x-user-agent-processed'));
			assert.equal(res.headers.get('x-user-agent-processed'), 'true');
		});

		it('should have access to query parameters', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/static-page?debug=true`);
			// Middleware should have read query param and added header
			assert.ok(res.headers.get('x-debug-mode'));
			assert.equal(res.headers.get('x-debug-mode'), 'true');
		});
	});

	describe('Response handling', () => {
		it('should use middleware response when middleware returns early', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/blocked`);
			assert.equal(res.status, 403);
			const text = await res.text();
			assert.ok(text.includes('Access denied'));
		});

		it('should redirect when middleware returns redirect', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/redirect-me`, {
				redirect: 'manual',
			});
			assert.equal(res.status, 302);
			assert.equal(res.headers.get('location'), '/redirected');
		});

		it('should serve static file when middleware calls next()', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/allowed`);
			assert.equal(res.status, 200);
			const html = await res.text();
			assert.ok(html.includes('<h1>Static Page</h1>'));
		});

		it('should set cookies from middleware', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/set-cookie-page`);
			const setCookie = res.headers.get('set-cookie');
			assert.ok(setCookie);
			assert.ok(setCookie.includes('middleware-cookie=value'));
		});
	});

	describe('Asset handling', () => {
		it('should NOT run middleware for CSS files', async () => {
			// Note: This test assumes CSS files exist in _astro folder after build
			// For a proper test, we'd need to ensure some CSS is generated
			const res = await fetch(`http://${server.host}:${server.port}/_astro/test.css`);
			// Middleware should not add this header for assets (404 is ok, just no middleware header)
			assert.equal(res.headers.get('x-middleware-ran'), null);
		});

		it('should NOT run middleware for JS files', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/_astro/test.js`);
			assert.equal(res.headers.get('x-middleware-ran'), null);
		});

		it('should NOT run middleware for images', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/test.png`);
			assert.equal(res.headers.get('x-middleware-ran'), null);
		});
	});

	describe('Error handling', () => {
		it('should serve static file even if middleware doesn\'t affect it', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/error-page`);
			// Should still serve the static file
			assert.equal(res.status, 200);
			const html = await res.text();
			assert.ok(html.includes('<h1>Static Error Page</h1>'));
		});
	});
});

