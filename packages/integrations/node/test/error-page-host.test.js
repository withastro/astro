import * as assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('Prerendered error page host', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devPreview;
	let errorPageServer;
	let errorPageRequests = [];

	before(async () => {
		// Start local server to serve error pages
		errorPageServer = createServer((req, res) => {
			errorPageRequests.push(req.url);

			if (req.url === '/404.html') {
				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.end('<html><body><h1>Custom 404 Page</h1></body></html>');
			} else if (req.url === '/500.html') {
				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.end('<html><body><h1>Custom 500 Page</h1></body></html>');
			} else {
				res.writeHead(404);
				res.end('Not found');
			}
		});

		await new Promise((resolve) => {
			errorPageServer.listen(3030, resolve);
		});

		fixture = await loadFixture({
			root: './fixtures/preview-headers/',
			adapter: nodejs({ mode: 'standalone', experimentalErrorPageHost: 'http://localhost:3030' }),
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
		if (errorPageServer) {
			errorPageServer.close();
		}
	});

	it('requests prerendered 404 page from the configured host', async () => {
		// Clear any previous requests
		errorPageRequests = [];

		// Make request to non-existent page
		const response = await fixture.fetch('/nonexistent');
		// Verify the error page host received a request for 404.html
		assert.ok(
			errorPageRequests.includes('/404.html'),
			'Error page host should receive request for 404.html',
		);

		// Verify we get the custom error page content
		const text = await response.text();
		assert.ok(text.includes('Custom 404 Page'), 'Should serve error page content from host');
	});
	it('requests prerendered 500 page from the configured host', async () => {
		// Clear any previous requests
		errorPageRequests = [];

		// Make request to trigger a 500 error
		const response = await fixture.fetch('/error?error=true');
		// Verify the error page host received a request for 500.html
		assert.ok(
			errorPageRequests.includes('/500.html'),
			'Error page host should receive request for 500.html',
		);

		// Verify we get the custom error page content
		const text = await response.text();
		assert.ok(text.includes('Custom 500 Page'), 'Should serve error page content from host');
	});

	it('throws if experimentalErrorPageHost is not a valid URL', async () => {
		await assert.rejects(
			async () =>
				loadFixture({
					root: './fixtures/preview-headers/',
					adapter: nodejs({ mode: 'standalone', experimentalErrorPageHost: 'invalid-url' }),
				}),
			{
				name: 'AstroUserError',
				message: /Invalid experimentalErrorPageHost/,
			},
		);
	});
});
