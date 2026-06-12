import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import type { MiddlewareHandler } from '../../../dist/types/public/common.js';
import { createManifest, createRouteInfo } from './test-helpers.ts';

/**
 * Tests that double-URL-encoded paths do not bypass middleware authorization.
 *
 * Multi-level encoding is decoded iteratively so middleware always sees the
 * canonical path. For example, /api/%2561dmin/users is decoded to
 * /api/admin/users, which the auth middleware correctly blocks with 401.
 */

const routeOptions: Parameters<typeof parseRoute>[1] = {
	config: { base: '/', trailingSlash: 'ignore' },
	pageExtensions: [],
} as any;

// Catch-all API endpoint: /api/[...path]
// Represents a typical BFF or API proxy behind middleware auth.
const apiCatchAllRouteData = parseRoute('api/[...path].ts', routeOptions, {
	component: 'src/pages/api/[...path].ts',
	type: 'endpoint',
});

const publicRouteData = parseRoute('index.astro', routeOptions, {
	component: 'src/pages/index.astro',
});

const publicPage = createComponent((_result: any, _props: any, _slots: any) => {
	return render`<h1>Public</h1>`;
});

const pageMap = new Map<string, any>([
	[
		apiCatchAllRouteData.component,
		async () => ({
			page: async () => ({
				GET: async ({ params, url }: { params: Record<string, any>; url: URL }) =>
					new Response(
						JSON.stringify({
							path: params.path,
							url_pathname: url.pathname,
						}),
						{ headers: { 'Content-Type': 'application/json' } },
					),
			}),
		}),
	],
	[
		publicRouteData.component,
		async () => ({
			page: async () => ({
				default: publicPage,
			}),
		}),
	],
]);

/**
 * Middleware that blocks access to /api/admin, as documented in Astro's
 * middleware guide for path-based authorization.
 */
function createAuthMiddleware() {
	return (async () => ({
		onRequest: (async (context, next) => {
			if (context.url.pathname.startsWith('/api/admin')) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return next();
		}) satisfies MiddlewareHandler,
	})) as () => Promise<{ onRequest: MiddlewareHandler }>;
}

function createApp(middleware: ReturnType<typeof createAuthMiddleware>) {
	return new App(
		createManifest({
			routes: [createRouteInfo(apiCatchAllRouteData), createRouteInfo(publicRouteData)],
			pageMap: pageMap as any,
			middleware: middleware as any,
		}) as any,
	);
}

describe('URL normalization: double-encoding middleware bypass', () => {
	it('middleware blocks /api/admin/users', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/admin/users');
		const response = await app.render(request);
		assert.equal(response.status, 401, '/api/admin/users should be blocked by middleware');
	});

	it('middleware blocks single-encoded /api/%61dmin/users', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/%61dmin/users');
		const response = await app.render(request);
		assert.equal(
			response.status,
			401,
			'/api/%61dmin/users should be blocked (single encoding decodes to /api/admin/users)',
		);
	});

	it('middleware blocks double-encoded /api/%2561dmin/users (iteratively decoded)', async () => {
		// Double-encoded: %2561 → %61 → a. Middleware sees /api/admin/users
		// and correctly returns 401 Unauthorized.
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/%2561dmin/users');
		const response = await app.render(request);
		assert.equal(
			response.status,
			401,
			'/api/%2561dmin/users should be blocked by middleware (decoded to /api/admin/users)',
		);
	});

	it('middleware blocks double-encoded paths with multiple encoded segments', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/%2561dmin/%75sers');
		const response = await app.render(request);
		assert.equal(
			response.status,
			401,
			'/api/%2561dmin/%75sers should be blocked by middleware (decoded to /api/admin/users)',
		);
	});

	it('public route is still accessible', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/ should be accessible');
		const html = await response.text();
		assert.match(html, /Public/);
	});

	it('non-protected API routes are still accessible', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/public/data');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/api/public/data should be accessible');
		const body = await response.json();
		assert.equal(body.path, 'public/data');
	});

	it('single-encoded non-admin API routes still work', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/us%65rs/list');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/api/us%65rs/list should be accessible');
		const body = await response.json();
		assert.equal(body.path, 'users/list');
	});

	// #region False-positive regression tests (issue #16781)

	it('accepts encodeURIComponent output with a literal % next to a reserved char', async () => {
		const app = createApp(createAuthMiddleware());
		const filename = encodeURIComponent('%?.pdf');
		const request = new Request(`http://example.com/api/uploads/${filename}`);
		const response = await app.render(request);
		assert.equal(response.status, 200, `/api/uploads/${filename} should be accessible`);
		const body = await response.json();
		assert.equal(body.path, 'uploads/%%3F.pdf');
	});

	it('accepts %25%23 (encoded literal % next to encoded #)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/files/%25%23readme');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/api/files/%25%23readme should be accessible');
		const body = await response.json();
		assert.equal(body.path, 'files/%%23readme');
	});

	it('accepts %25 at end of path segment (bare literal percent)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/data/%25');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/api/data/%25 should be accessible');
		const body = await response.json();
		assert.equal(body.path, 'data/%');
	});

	// #endregion
	// #region Double-encoded non-admin paths (issue #16960 — Sanity Studio)
	// These should be decoded and served, not rejected.

	it('serves double-encoded non-admin API routes', async () => {
		const app = createApp(createAuthMiddleware());
		// %255B → %5B → [, %255D → %5D → ]
		const request = new Request('http://example.com/api/sections%255B_key%255D');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/api/sections%255B_key%255D should be accessible');
		const body = await response.json();
		assert.equal(body.path, 'sections[_key]');
	});

	// #endregion
	// #region Creative triple-encoding (decoded, middleware still catches attacks)

	it('middleware blocks creative triple-encoding that decodes to /api/admin', async () => {
		// %25%32%3561dmin: %25 → %, %32 → 2, %35 → 5 → pass 1 = %2561dmin
		// → pass 2 = %61dmin → pass 3 = admin
		// Middleware sees /api/admin and blocks it.
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/%25%32%3561dmin/users');
		const response = await app.render(request);
		assert.equal(
			response.status,
			401,
			'creative triple-encoding %25%32%3561dmin should be blocked by middleware',
		);
	});

	it('serves creative encoding that decodes to a non-admin path', async () => {
		// %25%32%35%32%35 → decodeURI → %2525 → %25 → %
		// This decodes to just "%", which is a non-admin path.
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/%25%32%35%32%35');
		const response = await app.render(request);
		assert.equal(
			response.status,
			200,
			'creative encoding that decodes to a non-admin path should be served',
		);
	});
	// #endregion
});
