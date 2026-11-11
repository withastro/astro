import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// The fixture's feature plugin registers everything through `api.astroRouter` and records the
// route-table and build-done callbacks here.
const record = () => (globalThis as any).__routerApiFeature as Record<string, any>;

describe('api.astroRouter registrations', () => {
	describe('dev', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/router-api/',
				outDir: './dist/router-api-dev/',
				cacheDir: './node_modules/.astro-test/router-api-dev/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('provides a render context key on the Astro global', async () => {
			const $ = cheerio.load(await fixture.fetch('/').then((res) => res.text()));
			assert.equal($('#greeting').text(), 'Hello from /');
		});

		it('provides a render context key on the endpoint context', async () => {
			const json = await fixture.fetch('/api').then((res) => res.json());
			assert.equal(json.greeting, 'Hello from /api');
		});

		it('serves injected routes', async () => {
			const $ = cheerio.load(await fixture.fetch('/injected').then((res) => res.text()));
			assert.equal($('#injected').text(), 'Hello from /injected');
		});

		it('runs the fetch handler, which reads its manifest module', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.headers.get('x-feature-data'), 'from the manifest');
		});

		it('matches routes with the pathname a routing extension resolves', async () => {
			const json = await fixture.fetch('/alias').then((res) => res.json());
			assert.equal(json.greeting, 'Hello from /api');
		});

		it('passes the route table to onRoutesResolved', () => {
			assert.ok(record().routes.includes('/injected'));
			assert.ok(record().routes.includes('/api'));
		});

		it('runs route table transforms before the internal routes are added', async () => {
			const { transformed } = record();
			assert.ok(transformed.routes.includes('/injected'));
			assert.ok(transformed.routes.includes('/removed'));
			assert.ok(!transformed.routes.some((route: string) => route.startsWith('/_server-islands')));
			assert.equal(transformed.context.trailingSlash, 'ignore');
			assert.ok(transformed.context.srcDir instanceof URL);
			assert.ok(!record().routes.includes('/removed'));
			assert.equal((await fixture.fetch('/removed')).status, 404);
		});
	});

	describe('build', () => {
		let fixture: Fixture;
		let app: App;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/router-api/',
				outDir: './dist/router-api-build/',
				cacheDir: './node_modules/.astro-test/router-api-build/',
				adapter: testAdapter(),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('prerenders pages with the render context key', async () => {
			const $ = cheerio.load(await fixture.readFile('/client/index.html'));
			assert.equal($('#greeting').text(), 'Hello from /');
			const injected = cheerio.load(await fixture.readFile('/client/injected/index.html'));
			// Prerendered with `build.format: 'directory'`, so the pathname ends with a slash.
			assert.equal(injected('#injected').text(), 'Hello from /injected/');
		});

		it('runs the fetch handler and render context in the server build', async () => {
			const res = await app.render(new Request('http://example.com/api'));
			assert.equal(res.headers.get('x-feature-data'), 'from the manifest');
			assert.equal((await res.json()).greeting, 'Hello from /api');
		});

		it('resolves routing extensions and manifest data in the server build', async () => {
			const res = await app.render(new Request('http://example.com/alias'));
			assert.equal((await res.json()).greeting, 'Hello from /api');
		});

		it('does not build routes a route table transform removed', async () => {
			await assert.rejects(fixture.readFile('/client/removed/index.html'));
		});

		it('calls onPrerenderDone with the prerenderer', () => {
			assert.equal(record().prerenderDone.prerenderer, 'astro:default');
		});

		it('calls onBuildDone with the output directory and pages', () => {
			const { buildDone } = record();
			assert.ok(buildDone.dir instanceof URL);
			assert.ok(
				buildDone.pages.some((page: { pathname: string }) => page.pathname === 'injected/'),
			);
			assert.ok(buildDone.routes.some((route: { route: string }) => route.route === '/injected'));
		});
	});
});
