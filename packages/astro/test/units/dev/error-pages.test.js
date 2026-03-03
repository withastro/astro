// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { ensure404Route } from '../../../dist/core/routing/astro-designed-error-pages.js';
import { createFixture, createRequestAndResponse, runInContainer } from '../test-utils.js';

describe('Dev pipeline - error pages', () => {
	describe('Custom 404', () => {
		it('renders the custom 404.astro page for unmatched routes', async () => {
			const fixture = await createFixture({
				'/src/pages/404.astro': `<h1>Custom 404</h1>`,
				'/src/pages/index.astro': `<h1>Home</h1>`,
			});

			await runInContainer({ inlineConfig: { root: fixture.path } }, async (container) => {
				const r = createRequestAndResponse({ method: 'GET', url: '/does-not-exist' });
				container.handle(r.req, r.res);
				await r.done;

				assert.equal(r.res.statusCode, 404);
				const html = await r.text();
				const $ = cheerio.load(html);
				assert.equal($('h1').text(), 'Custom 404');
			});
		});

		it('renders the built-in Astro 404 page when no custom 404.astro exists', async () => {
			const fixture = await createFixture({
				'/src/pages/index.astro': `<h1>Home</h1>`,
			});

			await runInContainer({ inlineConfig: { root: fixture.path } }, async (container) => {
				const r = createRequestAndResponse({ method: 'GET', url: '/does-not-exist' });
				container.handle(r.req, r.res);
				await r.done;

				assert.equal(r.res.statusCode, 404);
			});
		});

		it('serves the custom 404 page for the /404 path itself', async () => {
			const fixture = await createFixture({
				'/src/pages/404.astro': `<h1>Custom 404</h1>`,
				'/src/pages/index.astro': `<h1>Home</h1>`,
			});

			await runInContainer({ inlineConfig: { root: fixture.path } }, async (container) => {
				const r = createRequestAndResponse({ method: 'GET', url: '/404' });
				container.handle(r.req, r.res);
				await r.done;

				assert.equal(r.res.statusCode, 404);
				const html = await r.text();
				const $ = cheerio.load(html);
				assert.equal($('h1').text(), 'Custom 404');
			});
		});
	});

	describe('Custom 500', () => {
		it('renders the custom 500.astro page when a route throws', async () => {
			const fixture = await createFixture({
				'/src/pages/index.astro': `---
throw new Error('boom');
---`,
				'/src/pages/500.astro': `<h1>Server Error</h1>`,
			});

			await runInContainer(
				{ inlineConfig: { root: fixture.path, output: 'server' } },
				async (container) => {
					const r = createRequestAndResponse({ method: 'GET', url: '/' });
					container.handle(r.req, r.res);
					await r.done;

					assert.equal(r.res.statusCode, 500);
					const html = await r.text();
					const $ = cheerio.load(html);
					assert.equal($('h1').text(), 'Server Error');
				},
			);
		});

		it('renders the dev overlay when no custom 500.astro exists and a route throws', async () => {
			const fixture = await createFixture({
				'/src/pages/index.astro': `---
throw new Error('boom');
---`,
			});

			await runInContainer(
				{ inlineConfig: { root: fixture.path, output: 'server' } },
				async (container) => {
					const r = createRequestAndResponse({ method: 'GET', url: '/' });
					container.handle(r.req, r.res);
					await r.done;

					assert.equal(r.res.statusCode, 500);
					const html = await r.text();
					// Dev overlay is emitted when DevApp throws (no custom 500 to catch it)
					assert.ok(html.includes('/@vite/client'));
				},
			);
		});

		it('renders the custom 500.astro page when an error originates in middleware', async () => {
			const fixture = await createFixture({
				'/src/pages/index.astro': `<h1>Home</h1>`,
				'/src/pages/500.astro': `<h1>Server Error</h1>`,
				'/src/middleware.js': `
export const onRequest = (_ctx, _next) => {
  throw new Error('middleware error');
};
`,
			});

			await runInContainer(
				{ inlineConfig: { root: fixture.path, output: 'server' } },
				async (container) => {
					const r = createRequestAndResponse({ method: 'GET', url: '/' });
					container.handle(r.req, r.res);
					await r.done;

					assert.equal(r.res.statusCode, 500);
					const html = await r.text();
					const $ = cheerio.load(html);
					assert.equal($('h1').text(), 'Server Error');
				},
			);
		});

		it('falls back to the dev overlay when the custom 500.astro itself throws', async () => {
			const fixture = await createFixture({
				'/src/pages/index.astro': `---
throw new Error('page error');
---`,
				'/src/pages/500.astro': `---
throw new Error('500 page also broken');
---`,
			});

			await runInContainer(
				{ inlineConfig: { root: fixture.path, output: 'server' } },
				async (container) => {
					const r = createRequestAndResponse({ method: 'GET', url: '/' });
					container.handle(r.req, r.res);
					await r.done;

					assert.equal(r.res.statusCode, 500);
					const html = await r.text();
					// Escalated to dev overlay after custom 500 also threw
					assert.ok(html.includes('/@vite/client'));
				},
			);
		});

		it('re-throws AstroError MiddlewareNoDataOrNextCalled immediately without rendering a 500 page', async () => {
			// Middleware that neither calls next() nor returns a Response triggers
			// MiddlewareNoDataOrNextCalled. DevApp re-throws this class of AstroError
			// immediately rather than attempting to render the 500 page, because the
			// error indicates a programming mistake in the middleware itself.
			const fixture = await createFixture({
				'/src/pages/index.astro': `<h1>Home</h1>`,
				'/src/pages/500.astro': `<h1>Server Error</h1>`,
				'/src/middleware.js': `
export const onRequest = (_ctx, _next) => {
  // intentionally not calling next() and not returning — triggers MiddlewareNoDataOrNextCalled
};
`,
			});

			await runInContainer(
				{ inlineConfig: { root: fixture.path, output: 'server' } },
				async (container) => {
					const r = createRequestAndResponse({ method: 'GET', url: '/' });
					container.handle(r.req, r.res);
					await r.done;

					assert.equal(r.res.statusCode, 500);
					const html = await r.text();
					// MiddlewareNoDataOrNextCalled is re-thrown straight to the dev overlay,
					// bypassing the custom 500 page entirely.
					assert.ok(html.includes('/@vite/client'));
					// The custom 500 page should NOT have been rendered.
					assert.ok(!html.includes('Server Error'));
				},
			);
		});
	});

	describe('ensure404Route', () => {
		it('adds the default /404 route when none exists in the manifest', () => {
			/** @type {{ routes: any[] }} */
			const manifest = { routes: [] };
			ensure404Route(manifest);

			const route404 = manifest.routes.find((r) => r.route === '/404');
			assert.ok(route404, 'A /404 route should be added when none exists');
		});

		it('does not add a duplicate /404 route when one already exists', () => {
			/** @type {{ routes: any[] }} */
			const manifest = {
				routes: [
					{
						route: '/404',
						component: 'src/pages/404.astro',
						params: [],
						pathname: '/404',
						distURL: [],
						pattern: /^\/404\/?$/,
						segments: [[{ content: '404', dynamic: false, spread: false }]],
						type: 'page',
						prerender: false,
						fallbackRoutes: [],
						isIndex: false,
						origin: 'project',
					},
				],
			};
			ensure404Route(manifest);
			ensure404Route(manifest); // call twice to verify idempotency

			const count = manifest.routes.filter((r) => r.route === '/404').length;
			assert.equal(count, 1, 'There should be exactly one /404 route');
		});

		it('preserves the user-provided 404 component rather than substituting the default', () => {
			const userComponent = 'src/pages/404.astro';
			/** @type {{ routes: any[] }} */
			const manifest = {
				routes: [
					{
						route: '/404',
						component: userComponent,
						params: [],
						pathname: '/404',
						distURL: [],
						pattern: /^\/404\/?$/,
						segments: [[{ content: '404', dynamic: false, spread: false }]],
						type: 'page',
						prerender: false,
						fallbackRoutes: [],
						isIndex: false,
						origin: 'project',
					},
				],
			};
			ensure404Route(manifest);

			const route404 = manifest.routes.find((r) => r.route === '/404');
			assert.equal(
				route404?.component,
				userComponent,
				'User-provided 404 component should not be replaced by the default',
			);
		});

		it('does not affect /500 routes', () => {
			/** @type {{ routes: any[] }} */
			const manifest = {
				routes: [
					{
						route: '/500',
						component: 'src/pages/500.astro',
						params: [],
						pathname: '/500',
						distURL: [],
						pattern: /^\/500\/?$/,
						segments: [[{ content: '500', dynamic: false, spread: false }]],
						type: 'page',
						prerender: false,
						fallbackRoutes: [],
						isIndex: false,
						origin: 'project',
					},
				],
			};
			ensure404Route(manifest);

			// /404 should be added (no user 404 exists), /500 should be untouched
			const count500 = manifest.routes.filter((r) => r.route === '/500').length;
			assert.equal(count500, 1, '/500 route count should remain exactly 1');

			const has404 = manifest.routes.some((r) => r.route === '/404');
			assert.ok(has404, 'Default /404 should have been added');
		});
	});
});
