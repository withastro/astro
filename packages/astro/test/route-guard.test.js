import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Route Guard - Dev Server', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/route-guard/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('Files at project root should return 404 for browser requests', () => {
		// Browser navigation sends Accept: text/html - these should be blocked
		const browserHeaders = { headers: { Accept: 'text/html' } };

		it('404 when loading /README.md (file exists at project root)', async () => {
			const response = await fixture.fetch('/README.md', browserHeaders);
			assert.equal(response.status, 404);
		});

		it('404 when loading /LICENSE (file exists at project root)', async () => {
			const response = await fixture.fetch('/LICENSE', browserHeaders);
			assert.equal(response.status, 404);
		});

		it('404 when loading /config.json (file exists at project root)', async () => {
			const response = await fixture.fetch('/config.json', browserHeaders);
			assert.equal(response.status, 404);
		});

		it('404 when loading /package.json (file exists at project root)', async () => {
			const response = await fixture.fetch('/package.json', browserHeaders);
			assert.equal(response.status, 404);
		});
	});

	describe('Valid routes should work', () => {
		it('200 when loading / (index page)', async () => {
			const response = await fixture.fetch('/');
			assert.equal(response.status, 200);
		});

		it('200 when loading /about (markdown page in src/pages)', async () => {
			const response = await fixture.fetch('/about');
			assert.equal(response.status, 200);
		});
	});

	describe('Public directory files should be served', () => {
		it('200 when loading /robots.txt (file in public directory)', async () => {
			const response = await fixture.fetch('/robots.txt');
			assert.equal(response.status, 200);
			const text = await response.text();
			assert.match(text, /User-agent/);
		});
	});

	describe('Non-existent files should 404 normally', () => {
		it('404 when loading /nonexistent.md (file does not exist)', async () => {
			const response = await fixture.fetch('/nonexistent.md');
			assert.equal(response.status, 404);
		});

		it('404 when loading /does-not-exist (no file, no route)', async () => {
			const response = await fixture.fetch('/does-not-exist');
			assert.equal(response.status, 404);
		});
	});

	describe('Vite internal paths should still work', () => {
		it('allows /@vite/ prefixed requests', async () => {
			// This tests that we don't block Vite internals
			// The actual response may vary, but it shouldn't be our custom 404
			const response = await fixture.fetch('/@vite/client');
			// Vite client should return 200 or handle it appropriately
			assert.notEqual(response.status, 404);
		});
	});
});
