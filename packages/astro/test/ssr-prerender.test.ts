import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import type { AstroIntegration } from 'astro';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('SSR: prerender', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-prerender/',
			output: 'server',
			outDir: './dist/normal',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	describe('Prerendering', () => {
		// Prerendered assets are not served directly by `app`,
		// they're served _in front of_ the app as static assets!
		it('Does not render static page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/static');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('includes prerendered pages in the asset manifest', async () => {
			const app = await fixture.loadTestAdapterApp();
			const assets = app.manifest.assets;
			assert.equal(assets.has('/static/index.html'), true);
		});
	});

	describe('?raw imports work in both SSR and prerendered routes', () => {
		it('raw import works in SSR route', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/not-prerendered');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('#raw-styles').text().includes('background: blue'), true);
		});

		it('raw import works in prerendered route', async () => {
			const html = await fixture.readFile('/client/static/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#raw-styles').text().includes('background: blue'), true);
		});
	});

	describe('Shared component CSS works in both SSR and prerendered routes', () => {
		it('shared component CSS is included in SSR route', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/not-prerendered');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			// Check that the shared component's scoped CSS is included
			assert.match(html, /color:red/);
		});

		it('shared component CSS is included in prerendered route', async () => {
			const html = await fixture.readFile('/client/static/index.html');
			// Check that the shared component's scoped CSS is included
			assert.match(html, /color:red/);
		});
	});

	describe('Astro.params in SSR', () => {
		it('Params are passed to component', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/users/houston');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('.user').text(), 'houston');
		});
	});

	describe('New prerender option breaks catch-all route on root when using preview', () => {
		// bug id #6020
		it('fix bug id #6020', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/some');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('p').text().includes('not give 404'), true);
		});
	});

	it('Renders markdown pages correctly', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/post');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		assert.equal($('#subheading').text(), 'Subheading');
	});
});

describe('SSR manifest does not include inline CSS for prerendered routes', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-prerender/',
			output: 'server',
			outDir: './dist/inline-stylesheets',
			adapter: testAdapter(),
			build: {
				inlineStylesheets: 'always',
			},
		});
		await fixture.build();
	});

	it('prerendered routes have empty styles in the SSR manifest', async () => {
		const app = await fixture.loadTestAdapterApp();
		const prerenderedRoutes = app.manifest.routes.filter((r) => r.routeData.prerender);
		assert.ok(prerenderedRoutes.length > 0, 'fixture must have prerendered routes');
		for (const route of prerenderedRoutes) {
			assert.deepEqual(
				route.styles,
				[],
				`route ${route.routeData.route} should have no styles in the SSR manifest`,
			);
		}
	});

	it('SSR routes still have inline styles in the SSR manifest', async () => {
		const app = await fixture.loadTestAdapterApp();
		const ssrRoute = app.manifest.routes.find((r) => r.routeData.route === '/not-prerendered');
		assert.ok(ssrRoute, 'expected /not-prerendered route');
		const hasInline = ssrRoute.styles.some(
			(s) => s.type === 'inline' && s.content.includes('ssr-only'),
		);
		assert.ok(hasInline, 'SSR route should retain its inline CSS in the manifest');
	});

	it('prerendered HTML on disk still contains inline <style> tags', async () => {
		const html = await fixture.readFile('/client/static/index.html');
		const $ = cheerio.load(html);
		const inlineStyles = $('style')
			.map((_, el) => $(el).text() ?? '')
			.toArray()
			.join('');
		assert.ok(
			inlineStyles.includes('prerender-only'),
			'prerendered HTML should still inline the route CSS',
		);
	});

	it('SSR entry chunk does not contain the prerender-only CSS string', async () => {
		const entry = (await fixture.readFile('/server/entry.mjs')).toString();
		assert.ok(
			!entry.includes('prerender-only'),
			'SSR entry should not carry inline CSS for prerendered routes',
		);
	});
});

// NOTE: This test doesn't make sense as it relies on the fact that on the client build,
// you can change the prerender state of pages from the SSR build, however, the client build
// is not always guaranteed to run. If we want to support this feature, we may want to only allow
// editing `route.prerender` on the `astro:build:done` hook.
describe.skip('Integrations can hook into the prerendering decision', () => {
	let fixture: Fixture;

	const testIntegration: AstroIntegration = {
		name: 'test prerendering integration',
		hooks: {
			['astro:build:setup']({ pages, target }) {
				if (target !== 'client') return;
				// this page has `export const prerender = true`
				pages.get('src/pages/static.astro')!.route.prerender = false;

				// this page does not
				pages.get('src/pages/not-prerendered.astro')!.route.prerender = true;
			},
		},
	};

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-prerender/',
			output: 'server',
			outDir: './dist/integration-prerender',
			integrations: [testIntegration],
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('An integration can override the prerender flag', async () => {
		// test adapter only hosts dynamic routes
		// /static is expected to become dynamic
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/static');
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('An integration can turn a normal page to a prerendered one', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/not-prerendered');
		const response = await app.render(request);
		assert.equal(response.status, 404);
	});
});
