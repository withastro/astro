import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRedirectsHandler } from '../../../dist/core/redirects/handler.js';
import { getParts } from '../../../dist/core/routing/parts.js';
import { createManifest, createRouteInfo } from '../app/test-helpers.ts';
import { makeRoute } from '../routing/test-helpers.ts';

import type { SSRManifest } from '../../../dist/core/app/types.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

/** Parse a route string like "/blog/[slug]" into RoutePart[][] segments. */
function parseSegments(route: string) {
	if (route === '/') return [[]];
	return route.split('/').filter(Boolean).map((s) => getParts(s, route));
}

function redirectRoute(overrides: {
	route: string;
	redirect: RouteData['redirect'];
	redirectRoute?: RouteData['redirectRoute'];
}): RouteData {
	const routeData = makeRoute({
		route: overrides.route,
		segments: parseSegments(overrides.route),
		trailingSlash: 'ignore',
		pathname: overrides.route,
		type: 'redirect',
	});
	routeData.redirect = overrides.redirect;
	routeData.redirectRoute = overrides.redirectRoute;
	return routeData;
}

function manifestWithRedirects(
	redirects: Parameters<typeof redirectRoute>[0][],
	manifestOverrides: Partial<SSRManifest> = {},
): SSRManifest {
	const routes = redirects.map((r) => createRouteInfo(redirectRoute(r)));
	return createManifest({ routes, ...manifestOverrides } as any) as unknown as SSRManifest;
}

describe('createRedirectsHandler', () => {
	describe('when no redirect routes exist', () => {
		it('returns undefined for any request', () => {
			const manifest = createManifest({ routes: [] }) as unknown as SSRManifest;
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/anything'));
			assert.equal(result, undefined);
		});
	});

	describe('basic static redirects', () => {
		it('returns a redirect response when the path matches', () => {
			const manifest = manifestWithRedirects([
				{ route: '/old', redirect: '/new' },
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/old'));
			assert.ok(result);
			assert.equal(result.status, 301);
			assert.equal(result.headers.get('location'), '/new');
		});

		it('returns undefined when the path does not match', () => {
			const manifest = manifestWithRedirects([
				{ route: '/old', redirect: '/new' },
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/other'));
			assert.equal(result, undefined);
		});

		it('returns 308 for POST requests', () => {
			const manifest = manifestWithRedirects([
				{ route: '/old', redirect: '/new' },
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/old', { method: 'POST' }));
			assert.ok(result);
			assert.equal(result.status, 308);
			assert.equal(result.headers.get('location'), '/new');
		});
	});

	describe('redirect with custom status', () => {
		it('uses the explicit status from the redirect config', () => {
			const targetRoute = makeRoute({
				route: '/new',
				segments: parseSegments('/new'),
				trailingSlash: 'ignore',
				pathname: '/new',
			});

			const manifest = manifestWithRedirects([
				{
					route: '/old',
					redirect: { destination: '/new', status: 302 },
					redirectRoute: targetRoute,
				},
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/old'));
			assert.ok(result);
			assert.equal(result.status, 302);
		});
	});

	describe('dynamic parameters', () => {
		it('substitutes a single dynamic param', () => {
			const manifest = manifestWithRedirects([
				{ route: '/blog/[slug]', redirect: '/articles/[slug]' },
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/blog/hello-world'));
			assert.ok(result);
			assert.equal(result.status, 301);
			assert.equal(result.headers.get('location'), '/articles/hello-world');
		});

		it('substitutes a spread param', () => {
			const manifest = manifestWithRedirects([
				{ route: '/docs/[...path]', redirect: '/wiki/[...path]' },
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/docs/a/b/c'));
			assert.ok(result);
			assert.equal(result.headers.get('location'), '/wiki/a/b/c');
		});
	});

	describe('external redirects', () => {
		it('uses Response.redirect for https:// targets', () => {
			const manifest = manifestWithRedirects([
				{ route: '/ext', redirect: 'https://example.com/page' },
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/ext'));
			assert.ok(result);
			assert.equal(result.status, 301);
			// Response.redirect normalises the URL
			assert.ok(result.headers.get('location')?.startsWith('https://example.com'));
		});

		it('uses Response.redirect for http:// targets', () => {
			const manifest = manifestWithRedirects([
				{ route: '/ext', redirect: 'http://example.com' },
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/ext'));
			assert.ok(result);
			assert.equal(result.status, 301);
			assert.ok(result.headers.get('location')?.startsWith('http://example.com'));
		});

		it('uses Response.redirect for external object redirects', () => {
			const manifest = manifestWithRedirects([
				{ route: '/ext', redirect: { destination: 'https://example.com', status: 307 } },
			]);
			const handler = createRedirectsHandler(manifest);

			// Note: computeRedirectStatus uses the object status only when
			// redirectRoute is defined, otherwise it falls back to method-based.
			const result = handler(new Request('http://localhost/ext'));
			assert.ok(result);
			assert.ok(result.headers.get('location')?.startsWith('https://example.com'));
		});
	});

	describe('base path stripping', () => {
		it('strips the base before matching', () => {
			const manifest = manifestWithRedirects(
				[{ route: '/old', redirect: '/new' }],
				{ base: '/app' },
			);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/app/old'));
			assert.ok(result);
			assert.equal(result.status, 301);
			assert.equal(result.headers.get('location'), '/new');
		});

	});

	describe('multiple redirect routes', () => {
		it('matches the first matching route', () => {
			const manifest = manifestWithRedirects([
				{ route: '/first', redirect: '/target-first' },
				{ route: '/second', redirect: '/target-second' },
			]);
			const handler = createRedirectsHandler(manifest);

			const r1 = handler(new Request('http://localhost/first'));
			assert.ok(r1);
			assert.equal(r1.headers.get('location'), '/target-first');

			const r2 = handler(new Request('http://localhost/second'));
			assert.ok(r2);
			assert.equal(r2.headers.get('location'), '/target-second');
		});

		it('returns undefined when no route matches', () => {
			const manifest = manifestWithRedirects([
				{ route: '/first', redirect: '/target-first' },
				{ route: '/second', redirect: '/target-second' },
			]);
			const handler = createRedirectsHandler(manifest);

			const result = handler(new Request('http://localhost/third'));
			assert.equal(result, undefined);
		});
	});

	describe('encoded URLs', () => {
		it('decodes the pathname for pattern matching', () => {
			const manifest = manifestWithRedirects([
				{ route: '/café', redirect: '/coffee' },
			]);
			const handler = createRedirectsHandler(manifest);

			// Browser sends encoded form
			const result = handler(new Request('http://localhost/caf%C3%A9'));
			assert.ok(result);
			assert.equal(result.headers.get('location'), '/coffee');
		});
	});
});
