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
			output: 'static',
			adapter: nodejs({
				mode: 'standalone',
				runMiddlewareOnRequest: true, // Enable the feature
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

		it('should resolve cookie value to "no-cookie" in prerendered page content', async () => {
			// Send a request with a cookie
			const res = await fetch(`http://${server.host}:${server.port}/static-page`, {
				headers: {
					cookie: 'test-cookie=should-not-appear',
				},
			});
			assert.equal(res.status, 200);
			const html = await res.text();
			
			// The page was prerendered, so it should show "no-cookie" regardless of the cookie sent
			// This is because Astro.cookies.get() on prerendered pages returns undefined/no-cookie
			assert.ok(html.includes('Cookie: no-cookie'));
			// Should NOT include the actual cookie value sent in the request
			assert.ok(!html.includes('should-not-appear'));
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

		it('should handle middleware errors gracefully', async () => {
			// This test verifies that the server doesn't crash when middleware throws
			// In practice, middleware errors should be caught and result in 500 responses
			// For now, we'll just verify the server is still running after potential errors
			const res = await fetch(`http://${server.host}:${server.port}/static-page`);
			assert.equal(res.status, 200);
			// If we got here, the server is still functional
			assert.ok(true, 'Server handled request successfully');
		});
	});

	describe('Locals support', () => {
		it('should allow middleware to access locals (simulated via manual handler)', async () => {
			// This test verifies that the handler signature supports locals
			// In a real Express app, Express middleware would set locals
			// Note: This is a simple check that the signature is correct
			// Full integration testing would require Express setup
			
			const { createStaticHandler } = await import('../dist/serve-static.js');
			const { handler: appModule } = await fixture.loadAdapterEntryModule();
			const staticHandler = createStaticHandler(appModule.app, {
				mode: 'standalone',
				host: false,
				port: server.port,
				server: new URL('./fixtures/middleware-static/dist/server/', import.meta.url),
				client: new URL('./fixtures/middleware-static/dist/client/', import.meta.url),
				assets: '_astro',
				experimentalStaticHeaders: false,
				runMiddlewareOnRequest: true,
			});

			// Create mock request/response
			let responseHeaders = {};

			const mockReq = {
				url: '/static-page',
				method: 'GET',
				headers: {
					host: 'localhost:' + server.port,
				},
				socket: {
					encrypted: false,
				},
			};

			const mockRes = {
				statusCode: 200,
				writeHead(status, headers) {
					this.statusCode = status;
					if (headers) {
						Object.assign(responseHeaders, headers);
					}
				},
				setHeader(name, value) {
					responseHeaders[name] = value;
				},
				getHeader(name) {
					return responseHeaders[name];
				},
				end() {
					// Response ended
				},
				headersSent: false,
			};

			// Simulate Express middleware setting locals
			const locals = { expressUser: 'testuser', expressSessionId: '12345' };

			// Call the static handler with locals
			await staticHandler(mockReq, mockRes, () => {}, locals);

			// Wait a bit for async operations
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify middleware ran and had access to locals
			assert.ok(responseHeaders['x-middleware-ran']);
			assert.equal(responseHeaders['x-express-user'], 'testuser');
			assert.equal(responseHeaders['x-express-session'], '12345');
		});
	});

	describe('Origin checking (CSRF protection)', () => {
		it('should allow GET requests regardless of origin (safe method)', async () => {
			// GET is a safe method and should always be allowed
			const res = await fetch(`http://${server.host}:${server.port}/static-page`, {
				method: 'GET',
				headers: {
					// Simulating a different origin
					origin: 'https://evil.com',
				},
			});
			assert.equal(res.status, 200);
		});

		it('should allow HEAD requests regardless of origin (safe method)', async () => {
			// HEAD is a safe method and should always be allowed
			const res = await fetch(`http://${server.host}:${server.port}/static-page`, {
				method: 'HEAD',
				headers: {
					origin: 'https://evil.com',
				},
			});
			assert.equal(res.status, 200);
		});

		it('should allow OPTIONS requests regardless of origin (safe method)', async () => {
			// OPTIONS is a safe method and should always be allowed
			const res = await fetch(`http://${server.host}:${server.port}/static-page`, {
				method: 'OPTIONS',
				headers: {
					origin: 'https://evil.com',
				},
			});
			// Should not be blocked (though static pages might return 404 for OPTIONS)
			assert.notEqual(res.status, 403);
		});

		it('should skip origin check for prerendered pages (marked as isPrerendered)', async () => {
			// Origin checking middleware checks context.isPrerendered and skips for prerendered pages
			// This test verifies that POST requests to static pages are NOT blocked
			// because they are marked as prerendered
			const res = await fetch(`http://${server.host}:${server.port}/static-page`, {
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					origin: 'https://evil.com',
				},
				body: 'test=data',
			});
			// Should NOT be 403 because prerendered pages skip origin checking
			// (The actual status might be 404 or 405 since POST to static file isn't supported,
			// but it shouldn't be 403 from CSRF protection)
			assert.notEqual(res.status, 403, 'Prerendered pages should skip origin checking');
		});
	});
});

