import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Middleware in DEV mode — integration hooks', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			outDir: './dist/middleware-middleware-in-dev-mode/',
			cacheDir: './node_modules/.astro-test/middleware-middleware-in-dev-mode/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

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

describe('Integration hooks with no user middleware', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-no-user-middleware/',
			outDir: './dist/middleware-integration-hooks-with-no-user-middlewar/',
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
	let fixture: Fixture;

	it('should build the project without errors', async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-full-ssr/',
			output: 'server',
			adapter: testAdapter({}),
			outDir: './dist/middleware-middleware-should-not-be-executed-or-imp/',
		});
		await fixture.build();
		assert.ok('Should build');
	});
});

describe('Middleware API in PROD mode, SSR', () => {
	let fixture: Fixture;
	let middlewarePath: URL | undefined;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			output: 'server',
			adapter: testAdapter({}),
			outDir: './dist/middleware-middleware-api-in-prod-mode-ssr/',
			cacheDir: './node_modules/.astro-test/middleware-middleware-api-in-prod-mode-ssr/',
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
		it('should reject double-encoded paths with 400', async () => {
			const request = new Request('http://example.com/%2561dmin');
			const response = await app.render(request);
			assert.equal(response.status, 400);
		});

		it('should reject triple-encoded paths with 400', async () => {
			const request = new Request('http://example.com/%252561dmin');
			const response = await app.render(request);
			assert.equal(response.status, 400);
		});
	});

	// keep this last
	it('the integration should receive the path to the middleware', async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware space/',
			output: 'server',
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
			outDir: './dist/middleware-path-encoding-in-middleware/',
			cacheDir: './node_modules/.astro-test/middleware-path-encoding-in-middleware/',
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
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-tailwind/',
			outDir: './dist/middleware-middleware-with-tailwind/',
		});
		await fixture.build();
	});

	it('should correctly emit the tailwind CSS file', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const bundledCSSHREF = $('link[rel=stylesheet][href^=/_astro/]').attr('href')!;
		const bundledCSS = (await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/')))
			.replace(/\s/g, '')
			.replace('/n', '');
		assert.equal(bundledCSS.includes('--tw'), true);
	});
});
