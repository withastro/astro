import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Middleware in DEV mode', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('Path encoding in middleware', () => {
		it('should reject double-encoded paths with 404', async () => {
			const res = await fixture.fetch('/%2561dmin', { redirect: 'manual' });
			assert.equal(res.status, 404);
		});

		it('should reject triple-encoded paths with 404', async () => {
			const res = await fixture.fetch('/%252561dmin', { redirect: 'manual' });
			assert.equal(res.status, 404);
		});
	});

	describe('Integration hooks', () => {
		it('Integration middleware marked as "pre" runs', async () => {
			const res = await fixture.fetch('/integration-pre');
			const json = await res.json();
			assert.equal(json.pre, 'works');
		});

		it('Integration middleware marked as "post" runs', async () => {
			const res = await fixture.fetch('/integration-post');
			const json = await res.json();
			assert.equal(json.post, 'works');
		});
	});
});

describe('Integration hooks with no user middleware', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-no-user-middleware/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Integration middleware marked as "pre" runs', async () => {
		const res = await fixture.fetch('/pre');
		const json = await res.json();
		assert.equal(json.pre, 'works');
	});

	it('Integration middleware marked as "post" runs', async () => {
		const res = await fixture.fetch('/post');
		const json = await res.json();
		assert.equal(json.post, 'works');
	});

	it('Integration middleware marked as "url" runs', async () => {
		const res = await fixture.fetch('/url');
		const json = await res.json();
		assert.equal(json.post, 'works');
	});
});

describe('Middleware should not be executed or imported during', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	it('should build the project without errors', async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-full-ssr/',
			output: 'server',
			adapter: testAdapter({}),
		});
		await fixture.build();
		assert.ok('Should build');
	});
});

describe('Middleware API in PROD mode, SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let middlewarePath;
	/** @type {import('../src/core/app/app.js').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			output: 'server',
			adapter: testAdapter({}),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('can render a page that does not exist', async () => {
		const request = new Request('http://example.com/does-not-exist');
		const routeData = app.match(request);

		const response = await app.render(request, { routeData });
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		assert.equal($('p').html(), null);
		assert.equal($('span').html(), 'New content!!');
	});

	it('can set locals for prerendered pages to use', async () => {
		const text = await fixture.readFile('/client/prerendered/index.html');
		assert.equal(text.includes('<p>yes they can!</p>'), true);
	});

	describe('Path encoding in middleware', () => {
		it('should reject double-encoded paths with 404', async () => {
			const request = new Request('http://example.com/%2561dmin');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('should reject triple-encoded paths with 404', async () => {
			const request = new Request('http://example.com/%252561dmin');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});
	});

	// keep this last
	it('the integration should receive the path to the middleware', async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			output: 'server',
			build: {
				excludeMiddleware: true,
			},
			adapter: testAdapter({
				extendAdapter: {
					adapterFeatures: {
						middlewareMode: 'edge',
					},
				},
				setMiddlewareEntryPoint(middlewareEntryPoint) {
					middlewarePath = middlewareEntryPoint;
				},
			}),
		});
		await fixture.build();
		assert.ok(middlewarePath);
		try {
			const path = fileURLToPath(middlewarePath);
			assert.equal(existsSync(path), true);
			const content = readFileSync(fileURLToPath(middlewarePath), 'utf-8');
			assert.equal(content.length > 0, true);
		} catch {
			assert.fail();
		}
	});
});

describe('Middleware with tailwind', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-tailwind/',
		});
		await fixture.build();
	});

	it('should correctly emit the tailwind CSS file', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const bundledCSSHREF = $('link[rel=stylesheet][href^=/_astro/]').attr('href');
		const bundledCSS = (await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/')))
			.replace(/\s/g, '')
			.replace('/n', '');
		assert.equal(bundledCSS.includes('--tw'), true);
	});
});

describe('Middleware sequence rewrites', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-sequence-rewrite/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should preserve cookies set in sequence', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		assert.ok(html.includes('Hello Another'));
		assert.ok(res.headers.get('set-cookie').includes('cookie1=Cookie%20from%20middleware%201'));
		assert.ok(res.headers.get('set-cookie').includes('cookie2=Cookie%20from%20middleware%202'));
	});
});
