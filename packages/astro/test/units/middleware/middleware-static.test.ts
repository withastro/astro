import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { getStaticAssetPath } from '../../../dist/core/util/static-paths.js';
import { createManifest, createRouteInfo } from '../app/test-helpers.ts';
import { createRouteData } from '../mocks.ts';
import { dynamicPart, staticPart } from '../routing/test-helpers.ts';

import type { MiddlewareHandler } from 'astro';
import type { RouteData } from '../../../dist/types/public/internal.js';

/**
 * Builds an `App` that runs middleware at request time for prerendered pages.
 *
 * Middleware is purely routing, so — unlike the old fixture-based test — we
 * don't need a built project. We assemble the manifest in memory and serve the
 * prerendered HTML through an inline `getStaticAsset` callback passed to
 * `app.render()`, exactly how an adapter (e.g. `@astrojs/node`) wires it up.
 */
function createStaticMiddlewareApp({
	onRequest,
	routes,
	base,
	middlewareMode = 'on-request',
}: {
	onRequest: MiddlewareHandler;
	routes: RouteData[];
	base?: string;
	middlewareMode?: 'classic' | 'on-request';
}): App {
	const manifest = createManifest({
		routes: routes.map((routeData) => createRouteInfo(routeData)),
		pageMap: new Map(),
		base,
	});
	// createManifest sets these to defaults; the pipeline reads them from the manifest.
	manifest.middleware = () => ({ onRequest });
	manifest.middlewareMode = middlewareMode;
	return new App(manifest);
}

// ----- Shared route data (all prerendered) -----

const aboutRouteData = createRouteData({ route: '/about', prerender: true });
const loginRouteData = createRouteData({ route: '/login', prerender: true });
const privateRouteData = createRouteData({ route: '/private', prerender: true });
const spacePageRouteData = createRouteData({
	route: '/My Page',
	pathname: '/My Page',
	prerender: true,
});
const notFoundRouteData = createRouteData({ route: '/404', prerender: true });
const frAboutRouteData = createRouteData({ route: '/fr/about', prerender: true });
const postRouteData = createRouteData({
	route: '/posts/[slug]',
	segments: [[staticPart('posts')], [dynamicPart('slug')]],
	prerender: true,
});

describe('Middleware for prerendered pages at request time', () => {
	it('injects middleware headers while serving static html', async () => {
		const onRequest: MiddlewareHandler = async (ctx, next) => {
			const response = await next();
			if (ctx.url.pathname === '/about') {
				response.headers.set('x-middleware-static', 'true');
			}
			return response;
		};
		const app = createStaticMiddlewareApp({ onRequest, routes: [aboutRouteData] });

		const getStaticAsset = async (_route: RouteData, _pathname: string) =>
			new Response('<p>About static page</p>', {
				headers: {
					'content-type': 'text/html; charset=utf-8',
					'x-static-asset': 'true',
				},
			});

		const request = new Request('http://example.com/about');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-middleware-static'), 'true');
		assert.equal(response.headers.get('x-static-asset'), 'true');
		assert.match(await response.text(), /About static page/);
	});

	it('resolves encoded pathnames for static assets', async () => {
		const onRequest: MiddlewareHandler = async (_ctx, next) => next();
		const app = createStaticMiddlewareApp({ onRequest, routes: [spacePageRouteData] });

		let requestedPathname = '';
		const getStaticAsset = async (_route: RouteData, pathname: string) => {
			requestedPathname = pathname;
			return new Response('<p>Path with a space</p>', {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/My%20Page');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		// The pathname handed to the adapter is decoded, not percent-encoded.
		assert.equal(requestedPathname, '/My Page');
		assert.match(await response.text(), /Path with a space/);
	});

	it('redirects in middleware without loading static files', async () => {
		const onRequest: MiddlewareHandler = async (ctx, next) => {
			if (ctx.url.pathname === '/private' && !ctx.cookies.get('auth')?.value) {
				return ctx.redirect('/login');
			}
			return next();
		};
		const app = createStaticMiddlewareApp({
			onRequest,
			routes: [privateRouteData, loginRouteData],
		});

		let staticReads = 0;
		const getStaticAsset = async (_route: RouteData, _pathname: string) => {
			staticReads++;
			return new Response('<p>Private static page</p>', {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/private');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 302);
		assert.equal(response.headers.get('Location'), '/login');
		assert.equal(staticReads, 0);
	});

	it('returns 404 status when serving the prerendered 404 page', async () => {
		const onRequest: MiddlewareHandler = async (_ctx, next) => next();
		const app = createStaticMiddlewareApp({ onRequest, routes: [notFoundRouteData] });

		const getStaticAsset = async (_route: RouteData, _pathname: string) =>
			new Response('<p>Custom static 404 page</p>', {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});

		const request = new Request('http://example.com/404');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 404);
		assert.match(await response.text(), /Custom static 404 page/);
	});

	it('resolves locale-prefixed static paths through middleware', async () => {
		const onRequest: MiddlewareHandler = async (ctx, next) => {
			const response = await next();
			if (ctx.url.pathname === '/fr/about') {
				response.headers.set('x-middleware-static', 'true');
			}
			return response;
		};
		const app = createStaticMiddlewareApp({ onRequest, routes: [frAboutRouteData] });

		let requestedPathname = '';
		const getStaticAsset = async (_route: RouteData, pathname: string) => {
			requestedPathname = pathname;
			return new Response('<p>Bonjour page statique</p>', {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/fr/about');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-middleware-static'), 'true');
		assert.equal(requestedPathname, '/fr/about');
		assert.match(await response.text(), /Bonjour page statique/);
	});

	it('resolves dynamic prerendered static paths through middleware', async () => {
		const onRequest: MiddlewareHandler = async (_ctx, next) => next();
		const app = createStaticMiddlewareApp({ onRequest, routes: [postRouteData] });

		let requestedPathname = '';
		const getStaticAsset = async (_route: RouteData, pathname: string) => {
			requestedPathname = pathname;
			return new Response('<p>Post: alpha</p>', {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/posts/alpha');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.equal(requestedPathname, '/posts/alpha');
		assert.match(await response.text(), /Post: alpha/);
	});
});

describe('Middleware for prerendered pages with base path', () => {
	// Routes are registered base-stripped; the request URL carries the base.
	const baseAboutRouteData = createRouteData({ route: '/about', prerender: true });
	const basePrivateRouteData = createRouteData({ route: '/private', prerender: true });

	it('injects headers with base path', async () => {
		const onRequest: MiddlewareHandler = async (ctx, next) => {
			const response = await next();
			if (ctx.url.pathname === '/test/about') {
				response.headers.set('x-middleware-static', 'true');
			}
			return response;
		};
		const app = createStaticMiddlewareApp({
			onRequest,
			routes: [baseAboutRouteData],
			base: '/test',
		});

		const getStaticAsset = async (_route: RouteData, _pathname: string) =>
			new Response('<p>About static page</p>', {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});

		const request = new Request('http://example.com/test/about');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-middleware-static'), 'true');
		assert.match(await response.text(), /About static page/);
	});

	it('redirects with base path without loading static files', async () => {
		const onRequest: MiddlewareHandler = async (ctx, next) => {
			if (ctx.url.pathname === '/test/private' && !ctx.cookies.get('auth')?.value) {
				return ctx.redirect('/login');
			}
			return next();
		};
		const app = createStaticMiddlewareApp({
			onRequest,
			routes: [basePrivateRouteData],
			base: '/test',
		});

		let staticReads = 0;
		const getStaticAsset = async (_route: RouteData, _pathname: string) => {
			staticReads++;
			return new Response('<p>Private static page</p>', {
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		};

		const request = new Request('http://example.com/test/private');
		const routeData = app.match(request, true);
		const response = await app.render(request, { routeData, getStaticAsset });

		assert.equal(response.status, 302);
		assert.match(response.headers.get('Location') ?? '', /\/login$/);
		assert.equal(staticReads, 0);
	});
});

describe('Classic mode without getStaticAsset callback', () => {
	it('does not serve prerendered pages through middleware in classic mode', async () => {
		// In classic mode the adapter does NOT provide `getStaticAsset` for
		// prerendered pages at request time. Without it — and without the page
		// component in the server bundle — rendering the prerendered page errors
		// with a 500, and the middleware redirect never runs.
		const onRequest: MiddlewareHandler = async (ctx, next) => {
			if (ctx.url.pathname === '/private') {
				return ctx.redirect('/login');
			}
			return next();
		};
		const app = createStaticMiddlewareApp({
			onRequest,
			routes: [privateRouteData, loginRouteData],
			middlewareMode: 'classic',
		});

		const request = new Request('http://example.com/private');
		const routeData = app.match(request, true);

		// No getStaticAsset callback provided — emulates classic mode behavior.
		const response = await app.render(request, { routeData });

		assert.equal(response.status, 500);
		assert.notEqual(response.headers.get('Location'), '/login');
	});
});

describe('getStaticAssetPath', () => {
	it('maps status codes to a flat `.html` file for every build format', () => {
		for (const buildFormat of ['file', 'directory', 'preserve'] as const) {
			assert.equal(getStaticAssetPath('/404', { base: '/', buildFormat }), '404.html');
			assert.equal(getStaticAssetPath('/500', { base: '/', buildFormat }), '500.html');
		}
	});

	it('maps pages by build format', () => {
		assert.equal(getStaticAssetPath('/about', { base: '/', buildFormat: 'file' }), 'about.html');
		assert.equal(
			getStaticAssetPath('/about', { base: '/', buildFormat: 'directory' }),
			'about/index.html',
		);
	});

	it('maps preserve index routes to nested index.html paths', () => {
		assert.equal(
			getStaticAssetPath('/blog/index', { base: '/', buildFormat: 'preserve' }),
			'blog/index/index.html',
		);
	});
});
