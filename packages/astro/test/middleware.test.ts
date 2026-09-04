import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
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
		it('middleware protects double-encoded /admin path', async () => {
			// %2561dmin is decoded iteratively: %2561 → %61 → a → admin
			// Middleware sees /admin and redirects (no auth token).
			const request = new Request('http://example.com/%2561dmin');
			const response = await app.render(request);
			assert.equal(
				response.status,
				302,
				'double-encoded /admin should trigger middleware redirect',
			);
		});

		it('middleware protects triple-encoded /admin path', async () => {
			// %252561dmin → %2561dmin → %61dmin → admin
			const request = new Request('http://example.com/%252561dmin');
			const response = await app.render(request);
			assert.equal(
				response.status,
				302,
				'triple-encoded /admin should trigger middleware redirect',
			);
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

describe('Middleware HMR', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	beforeEach(async () => {
		fixture = await loadFixture({
			root: './fixtures/hmr-middleware/',
			outDir: './dist/middleware-middleware-hmr/',
		});

		devServer = await fixture.startDevServer();
	});

	afterEach(async () => {
		await devServer.stop();
		fixture.resetAllFiles();
	});

	const fetchAndAssertTwice = async () => {
		let response = await fixture.fetch('/');
		assert.equal(response.headers.get('x-test-executed'), '1');
		assert.equal(response.headers.get('x-test-other-count'), '1');

		response = await fixture.fetch('/');
		assert.equal(response.headers.get('x-test-executed'), '2');
		assert.equal(response.headers.get('x-test-other-count'), '2');

		return response;
	};

	it('should perform HMR on middleware.js', async () => {
		await fetchAndAssertTwice();

		await fixture.editFile('./src/middleware.js', (original) =>
			original.replace('add newline here', 'add newline here\n'),
		);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		// src/middleware.js should reload
		// src/utils/other.js shouldn't reload
		const response = await fixture.fetch('/');
		assert.equal(response.headers.get('x-test-executed'), '1');
		assert.equal(response.headers.get('x-test-other-count'), '3');
	});

	it('should perform HMR on modules imported by middleware.js', async () => {
		let response = await fetchAndAssertTwice();
		assert.ok((await response.text()).includes('Hello Astro'));

		await fixture.editFile('./src/utils/misc.js', (original) =>
			original.replace('join(" ")', 'join(" - ")'),
		);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		// src/utils/misc.js should reload, as should src/middleware.js
		// src/pages/index.astro should therefore receive the new instance of MiscUtils
		// src/utils/other.js shouldn't reload
		response = await fixture.fetch('/');
		assert.equal(response.headers.get('x-test-executed'), '1');
		assert.equal(response.headers.get('x-test-other-count'), '3');
		assert.ok((await response.text()).includes('Hello - Astro'));
	});

	it('should perform HMR on nested modules imported by middleware.js', async () => {
		await fetchAndAssertTwice();

		await fixture.editFile('./src/utils/other.js', (original) =>
			original.replace('let count = 0;', 'let count = 0;\n//foo\n'),
		);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		// src/utils/other.js should reload, as should src/middleware.js
		const response = await fixture.fetch('/');
		assert.equal(response.headers.get('x-test-executed'), '1');
		assert.equal(response.headers.get('x-test-other-count'), '1');
	});

	it("shouldn't reload middleware.js when an unrelated module is reloaded", async () => {
		let response = await fetchAndAssertTwice();
		assert.equal(response.headers.get('x-index-count'), '2');

		await fixture.editFile('./src/utils/notImportedByMiddleware.js', (original) =>
			original.replace('let count = 0;', 'let count = 0;\n//foo\n'),
		);
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// src/utils/notImportedByMiddleware.js should reload
		// src/middleware.js shouldn't reload, and neither should src/utils/other.js
		response = await fixture.fetch('/');
		assert.equal(response.headers.get('x-test-executed'), '3');
		assert.equal(response.headers.get('x-test-other-count'), '3');
		assert.equal(response.headers.get('x-index-count'), '1');
	});
});
