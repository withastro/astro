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
 * When a path like /api/%2561dmin/users is received, validateAndDecodePathname
 * detects the multi-level encoding and must reject the request rather than
 * silently falling back to a single decodeURI() that leaves middleware
 * seeing a half-decoded pathname (/api/%61dmin/users) that doesn't match
 * its authorization checks.
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

	it('rejects double-encoded /api/%2561dmin/users with 400', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/%2561dmin/users');
		const response = await app.render(request);
		assert.equal(
			response.status,
			400,
			'/api/%2561dmin/users should be rejected as a bad request, not served',
		);
	});

	it('rejects double-encoded paths with multiple encoded segments', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/api/%2561dmin/%75sers');
		const response = await app.render(request);
		assert.equal(
			response.status,
			400,
			'/api/%2561dmin/%75sers should be rejected as a bad request',
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
});
