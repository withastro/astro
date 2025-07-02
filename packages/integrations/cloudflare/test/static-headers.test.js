import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli, wranglerCli } from './_test-utils.js';

const root = new URL('./fixtures/static-headers/', import.meta.url);
describe('StaticHeaders', () => {
	let wrangler;
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');

		wrangler = wranglerCli(fileURLToPath(root));
		await new Promise((resolve) => {
			wrangler.stdout.on('data', (data) => {
				// console.log('[stdout]', data.toString());
				if (data.toString().includes('http://127.0.0.1:8788')) resolve();
			});
			wrangler.stderr.on('data', (_data) => {
				// console.log('[stderr]', data.toString());
			});
		});
	});


	after((_done) => {
		wrangler.kill();
	});

	it('serves headers correctly for /', async () => {
		const res = await fetch('http://127.0.0.1:8788/');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Surrogate-Key'), 'root, catch-all');
		assert.ok(res.headers.get('Content-Security-Policy'));
	});

	it('serves headers correctly for /has-header', async () => {
		const res = await fetch('http://127.0.0.1:8788/has-header');
		assert.equal(res.status, 200);
		const cspHeader= res.headers.get('Content-Security-Policy')
		assert.ok(cspHeader.includes("script-src 'self' 'sha256-"))
		assert.ok(cspHeader.includes("style-src 'self' 'sha256-"))
	});

	it('serves headers correctly for /blog/post-slug', async () => {
		const res = await fetch('http://127.0.0.1:8788/blog/post-slug');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Surrogate-Key'), 'catch-all, blog-post');
		const cspHeader= res.headers.get('Content-Security-Policy')
		assert.ok(cspHeader.includes("script-src 'self' 'sha256-"))
		assert.ok(cspHeader.includes("style-src 'self' 'sha256-"))	});

	it('serves headers correctly for /parent/something/page', async () => {
		const res = await fetch('http://127.0.0.1:8788/parent/something/page');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Surrogate-Key'), 'catch-all, parent-page');
		const cspHeader= res.headers.get('Content-Security-Policy')
		assert.ok(cspHeader.includes("script-src 'self' 'sha256-"))
		assert.ok(cspHeader.includes("style-src 'self' 'sha256-"))	});

	it('serves headers correctly for /unknown-route', async () => {
		const res = await fetch('http://127.0.0.1:8788/unknown-route');
		assert.equal(res.status, 200);
		const cspHeader= res.headers.get('Content-Security-Policy')
		assert.ok(cspHeader.includes("script-src 'self' 'sha256-"))
		assert.ok(cspHeader.includes("style-src 'self' 'sha256-"))	});

	it('serves headers correctly for /blank', async () => {
		const res = await fetch('http://127.0.0.1:8788/blank');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Surrogate-Key'), 'catch-all');
		const cspHeader= res.headers.get('Content-Security-Policy')
		assert.ok(cspHeader.includes("script-src 'self' 'sha256-"))
		assert.ok(cspHeader.includes("style-src 'self' 'sha256-"))	});

	it('serves headers correctly for catch-all routes', async () => {
		const res = await fetch('http://127.0.0.1:8788/some-random-path');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Surrogate-Key'), 'catch-all');
		const cspHeader= res.headers.get('Content-Security-Policy')
		assert.ok(cspHeader.includes("script-src 'self' 'sha256-"))
		assert.ok(cspHeader.includes("style-src 'self' 'sha256-"))	});
});
