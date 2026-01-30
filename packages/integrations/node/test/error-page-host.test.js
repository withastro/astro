import * as assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('Prerendered error page host', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devPreview;
	/** @type {import('node:http').Server} */
	let errorPageServer;
	let errorPageRequests = [];

	before(async () => {
		// Start local server to serve error pages
		// This isn't something that would happen in production, but allows us to
		// see if Astro is correctly requesting the prerendered error pages
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
			root: './fixtures/prerender-error-page/',
			adapter: nodejs({ mode: 'standalone', experimentalErrorPageHost: 'http://localhost:3030' }),
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
		if (errorPageServer) {
			await new Promise((resolve) => {
				errorPageServer.close(resolve);
			});
		}
	});

	it('requests prerendered 404 page from the configured host', async () => {
		errorPageRequests = [];

		const response = await fixture.fetch('/nonexistent');
		assert.ok(
			errorPageRequests.includes('/404.html'),
			'Error page host should receive request for 404.html',
		);

		const text = await response.text();
		assert.ok(text.includes('Custom 404 Page'), 'Should serve error page content from host');
	});
	it('requests prerendered 500 page from the configured host', async () => {
		// Clear any previous requests
		errorPageRequests = [];

		const response = await fixture.fetch('/error?error=true');
		assert.ok(
			errorPageRequests.includes('/500.html'),
			'Error page host should receive request for 500.html',
		);

		const text = await response.text();
		assert.ok(text.includes('Custom 500 Page'), 'Should serve error page content from host');
	});

	it('throws if experimentalErrorPageHost is not a valid URL', async () => {
		await assert.rejects(
			async () =>
				loadFixture({
					root: './fixtures/prerender-error-page/',
					adapter: nodejs({ mode: 'standalone', experimentalErrorPageHost: 'invalid-url' }),
				}),
			{
				name: 'AstroUserError',
				message: /Invalid experimentalErrorPageHost/,
			},
		);

		await assert.rejects(
			async () =>
				loadFixture({
					root: './fixtures/prerender-error-page/',
					adapter: nodejs({ mode: 'standalone', experimentalErrorPageHost: 'file:///invalid-url' }),
				}),
			{
				name: 'AstroUserError',
				message: /Invalid experimentalErrorPageHost/,
			},
		);
	});
});
