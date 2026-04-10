import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { renderPath } from '../../../dist/core/build/generate.js';
import { createMockPrerenderer, createStaticBuildOptions } from '../build/test-helpers.ts';
import { createTestApp, createPage } from '../mocks.ts';
import { createComponent, render, renderComponent } from '../../../dist/runtime/server/index.js';

import type { StaticBuildOptions } from '../../../dist/core/build/types.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import type { MiddlewareHandler } from '../../../dist/types/public/common.js';

// Minimal target page for redirect destination routes
const TARGET_PAGE = '---\n---\n<p>Target</p>';

describe('static redirects — meta refresh output', () => {
	let options: StaticBuildOptions;

	before(async () => {
		options = await createStaticBuildOptions({
			pages: {
				'src/pages/test.astro': TARGET_PAGE,
				'src/pages/articles/[...slug].astro':
					'---\nexport function getStaticPaths(){return[{params:{slug:"one"}},{params:{slug:"two"}}]}\n---\n<p>{Astro.params.slug}</p>',
				'src/pages/more/new/[...spread].astro':
					'---\nexport function getStaticPaths(){return[{params:{spread:"welcome/world"}}]}\n---\n<p>{Astro.params.spread}</p>',
			},
			inlineConfig: {
				redirects: {
					'/old': '/test',
					'/one': '/test',
					'/two': '/test',
					'/three': { status: 302, destination: '/test' },
					'/external/redirect': 'https://example.com/',
					'/relative/redirect': '../../test',
					'/blog/[...slug]': '/articles/[...slug]',
					'/more/old/[...spread]': '/more/new/[...spread]',
				},
			},
		});
	});

	it('includes http-equiv refresh and target URL in redirect HTML', async () => {
		const route = (options.routesList as { routes: RouteData[] }).routes.find(
			(r) => r.route === '/one' && r.type === 'redirect',
		);
		assert.ok(route, 'expected /one redirect route');

		const prerenderer = createMockPrerenderer({
			'/one': new Response(null, { status: 301, headers: { location: '/test' } }),
		});
		const result = await renderPath({
			prerenderer,
			pathname: '/one',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('http-equiv="refresh"'));
		assert.ok(result.body.toString().includes('url=/test'));
	});

	it('generates redirect HTML for a 302 redirect', async () => {
		const route = (options.routesList as { routes: RouteData[] }).routes.find(
			(r) => r.route === '/three' && r.type === 'redirect',
		);
		assert.ok(route, 'expected /three redirect route');

		const prerenderer = createMockPrerenderer({
			'/three': new Response(null, { status: 302, headers: { location: '/test' } }),
		});
		const result = await renderPath({
			prerenderer,
			pathname: '/three',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('http-equiv="refresh"'));
		assert.ok(result.body.toString().includes('url=/test'));
	});

	it('generates redirect HTML for an external destination', async () => {
		const route = (options.routesList as { routes: RouteData[] }).routes.find(
			(r) => r.route === '/external/redirect' && r.type === 'redirect',
		);
		assert.ok(route, 'expected /external/redirect route');

		const prerenderer = createMockPrerenderer({
			'/external/redirect': new Response(null, {
				status: 301,
				headers: { location: 'https://example.com/' },
			}),
		});
		const result = await renderPath({
			prerenderer,
			pathname: '/external/redirect',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('http-equiv="refresh"'));
		assert.ok(result.body.toString().includes('url=https://example.com/'));
	});

	it('generates redirect HTML for a relative destination', async () => {
		const route = (options.routesList as { routes: RouteData[] }).routes.find(
			(r) => r.route === '/relative/redirect' && r.type === 'redirect',
		);
		assert.ok(route, 'expected /relative/redirect route');

		const prerenderer = createMockPrerenderer({
			'/relative/redirect': new Response(null, {
				status: 301,
				headers: { location: '../../test' },
			}),
		});
		const result = await renderPath({
			prerenderer,
			pathname: '/relative/redirect',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('http-equiv="refresh"'));
		assert.ok(result.body.toString().includes('url=../../test'));
	});

	it('generates redirect HTML for a dynamic slug redirect', async () => {
		const route = (options.routesList as { routes: RouteData[] }).routes.find(
			(r) => r.route === '/blog/[...slug]' && r.type === 'redirect',
		);
		assert.ok(route, 'expected /blog/[...slug] redirect route');

		const prerenderer = createMockPrerenderer({
			'/blog/one': new Response(null, { status: 301, headers: { location: '/articles/one' } }),
		});
		const result = await renderPath({
			prerenderer,
			pathname: '/blog/one',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('http-equiv="refresh"'));
		assert.ok(result.body.toString().includes('url=/articles/one'));
	});

	it('falls back to spread rule for multi-segment dynamic paths', async () => {
		const route = (options.routesList as { routes: RouteData[] }).routes.find(
			(r) => r.route === '/more/old/[...spread]' && r.type === 'redirect',
		);
		assert.ok(route, 'expected /more/old/[...spread] redirect route');

		const prerenderer = createMockPrerenderer({
			'/more/old/welcome/world': new Response(null, {
				status: 301,
				headers: { location: '/more/new/welcome/world' },
			}),
		});
		const result = await renderPath({
			prerenderer,
			pathname: '/more/old/welcome/world',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('http-equiv="refresh"'));
		assert.ok(result.body.toString().includes('url=/more/new/welcome/world'));
	});
});

describe('static redirects — config.build.redirects = false suppresses redirect pages', () => {
	let options: StaticBuildOptions;

	before(async () => {
		options = await createStaticBuildOptions({
			pages: { 'src/pages/index.astro': TARGET_PAGE },
			inlineConfig: {
				redirects: { '/one': '/' },
				build: { redirects: false },
			},
		});
	});

	it('returns null for a redirect route when build.redirects is false', async () => {
		const route = (options.routesList as { routes: RouteData[] }).routes.find(
			(r) => r.route === '/one' && r.type === 'redirect',
		);
		assert.ok(route, 'expected /one redirect route');

		const prerenderer = createMockPrerenderer({
			'/one': new Response(null, { status: 301, headers: { location: '/' } }),
		});
		const result = await renderPath({
			prerenderer,
			pathname: '/one',
			route,
			options,
			logger: options.logger,
		});

		assert.equal(result, null);
	});
});

describe('static redirects — site config does not affect redirect URL', () => {
	let options: StaticBuildOptions;

	before(async () => {
		options = await createStaticBuildOptions({
			pages: { 'src/pages/login.astro': TARGET_PAGE },
			inlineConfig: {
				redirects: { '/one': '/login' },
				site: 'https://example.com',
			},
		});
	});

	it('uses relative URL in redirect HTML even when site is set', async () => {
		const route = (options.routesList as { routes: RouteData[] }).routes.find(
			(r) => r.route === '/one' && r.type === 'redirect',
		);
		assert.ok(route, 'expected /one redirect route');

		const prerenderer = createMockPrerenderer({
			'/one': new Response(null, { status: 301, headers: { location: '/login' } }),
		});
		const result = await renderPath({
			prerenderer,
			pathname: '/one',
			route,
			options,
			logger: options.logger,
		});

		assert.ok(result !== null);
		assert.ok(!result.body.toString().includes('url=https://example.com/login'));
		assert.ok(result.body.toString().includes('url=/login'));
	});
});

describe('static redirects — middleware-generated redirect', () => {
	it('renders redirect HTML for a page that returns a redirect via middleware', async () => {
		const indexPage = createComponent(
			(_result: any, _props: any, _slots: any) => render`<p>Index</p>`,
		);
		const middleware: MiddlewareHandler = async (ctx, next) => {
			if (new URL(ctx.request.url).pathname === '/middleware-redirect/') {
				return new Response(null, { status: 301, headers: { Location: '/test' } });
			}
			return next();
		};

		const app = createTestApp([createPage(indexPage, { route: '/middleware-redirect' })], {
			middleware: () => ({ onRequest: middleware }),
		});

		const response = await app.render(new Request('http://example.com/middleware-redirect/'), {
			routeData: undefined,
		} as any);
		assert.equal(response.status, 301);
		assert.equal(response.headers.get('Location'), '/test');
	});
});

describe('static redirects — invalid redirect destination throws', () => {
	it('throws InvalidRedirectDestination when dynamic destination does not match any route', async () => {
		// Regression test for https://github.com/withastro/astro/issues/12036
		// where a redirect like /categories/[category] -> /categories/[category]/1
		// produced a misleading "getStaticPaths required" error instead of
		// a clear error about the invalid redirect destination.
		// The destination mixes a dynamic param [category] with a static segment "1"
		// but the actual route is /categories/[category]/[page].astro so
		// the routeMap won't find "/categories/[category]/1" as a key.
		await assert.rejects(
			() =>
				createStaticBuildOptions({
					pages: {
						'src/pages/categories/[category]/[page].astro':
							'---\nexport function getStaticPaths() { return []; }\n---\n<p>page</p>',
					},
					inlineConfig: {
						redirects: {
							'/categories/[category]': '/categories/[category]/1',
						},
					},
				}),
			(err: Error & { name: string }) => {
				// Should NOT be the misleading getStaticPaths error
				assert.ok(!err.message.includes('getStaticPaths()'));
				// Should be our new clear error message
				assert.ok(err.message.includes('does not match any existing route'));
				assert.equal(err.name, 'InvalidRedirectDestination');
				return true;
			},
		);
	});
});

describe('Astro.redirect() in a page component — build.redirects = false', () => {
	it('renders redirect HTML for a page that calls Astro.redirect() even when build.redirects is false', async () => {
		// /secret calls Astro.redirect('/login') in frontmatter.
		// build.redirects=false suppresses config-level redirect routes but must NOT
		// suppress pages that explicitly return a redirect response via Astro.redirect().
		const secretPage = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			return Astro.redirect('/login');
		});

		const app = createTestApp([createPage(secretPage, { route: '/secret' })]);
		const response = await app.render(new Request('http://example.com/secret/'));

		assert.equal(response.status, 302);
		assert.equal(response.headers.get('location'), '/login');
	});
});

describe('Astro.redirect() — site config does not inject absolute URL', () => {
	it('uses relative URL in Location header even when site is set', async () => {
		// The site config should not cause redirect URLs to become absolute.
		const secretPage = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			return Astro.redirect('/login');
		});

		const app = createTestApp([createPage(secretPage, { route: '/secret' })]);
		const response = await app.render(new Request('http://example.com/secret/'));

		const location = response.headers.get('location')!;
		assert.ok(!location.includes('https://example.com'), 'should not use absolute URL');
		assert.equal(location, '/login');
	});
});

describe('output: "server"', () => {
	// Routes intentionally use non-verbatim target names to ensure the redirect
	// system resolves by route pattern, not by filename:
	//   '/source/[dynamic]'         -> '/not-verbatim/target1/[dynamic]'
	//     (real file: not-verbatim/target1/[something-other-than-dynamic].astro)
	//   '/source/[dynamic]/[route]' -> '/not-verbatim/target2/[dynamic]/[route]'
	//     (real file: not-verbatim/target2/[abc]/[xyz].astro)
	//   '/source/[dynamic]/[prerender]' -> '/not-verbatim/target2/[dynamic]/[prerender]'
	//     (check for prerendered routes)
	//   '/source/[...spread]'       -> '/not-verbatim/target3/[...spread]'
	//     (real file: not-verbatim/target3/[...rest].astro)

	it('Warns when used inside a component', async () => {
		// A child component calls Astro.redirect() after the parent has already
		// started streaming HTML — the same pattern as late.astro + redirect.astro.
		const redirectChild = createComponent((result: any, props: any, slots: any) => {
			const Astro = result.createAstro(props, slots);
			return Astro.redirect('/login');
		});

		const latePage = createComponent(
			(result: any) =>
				render`<html><body><h1>Testing</h1>${renderComponent(result, 'Redirect', redirectChild, {})}</body></html>`,
		);

		const app = createTestApp([createPage(latePage, { route: '/late' })]);
		const request = new Request('http://example.com/late');
		const response = await app.render(request);

		try {
			await response.text();
			assert.equal(false, true);
		} catch (e: unknown) {
			assert.ok(e instanceof Error);
			assert.equal(
				e.message,
				'The response has already been sent to the browser and cannot be altered.',
			);
		}
	});
});
