import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { MiddlewareHandler } from '../../../dist/types/public/common.js';
import { App } from '../../../dist/core/app/app.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './test-helpers.ts';

/**
 * Tests that base stripping respects path-segment boundaries.
 *
 * With `base: '/app'`, only `/app` and paths under `/app/` belong to the base.
 * Stripping the base with a plain prefix check treats `/appX/admin` as under the
 * base and slices it to `/admin`, so the router matches `/admin` while
 * `context.url.pathname` still reads `/appX/admin`. Middleware keyed on the
 * base-prefixed pathname then sees a path it does not recognize.
 */

const routeOptions: Parameters<typeof parseRoute>[1] = {
	config: { base: '/app', trailingSlash: 'ignore' },
	pageExtensions: [],
} as any;

const adminRouteData = parseRoute('admin', routeOptions, {
	component: 'src/pages/admin.astro',
});

const publicRouteData = parseRoute('index.astro', routeOptions, {
	component: 'src/pages/index.astro',
});

const adminPage = createComponent((_result: any, _props: any, _slots: any) => {
	return render`<h1>Admin Panel</h1>`;
});

const publicPage = createComponent((_result: any, _props: any, _slots: any) => {
	return render`<h1>Public</h1>`;
});

const pageMap = new Map([
	[
		adminRouteData.component,
		async () => ({
			page: async () => ({
				default: adminPage,
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
 * Middleware that blocks access to the base-prefixed `/app/admin` route,
 * as recommended in the official Astro authentication docs.
 */
function createAuthMiddleware() {
	return (async () => ({
		onRequest: (async (context, next) => {
			const pathname = context.url.pathname;
			if (pathname === '/app/admin' || pathname.startsWith('/app/admin/')) {
				return new Response('Forbidden', { status: 403 });
			}
			return next();
		}) satisfies MiddlewareHandler,
	})) as () => Promise<{ onRequest: MiddlewareHandler }>;
}

function createApp(middleware: ReturnType<typeof createAuthMiddleware>) {
	return new App(
		createManifest({
			base: '/app',
			routes: [createRouteInfo(adminRouteData), createRouteInfo(publicRouteData)],
			pageMap: pageMap as any,
			middleware: middleware as any,
		}) as any,
	);
}

describe('base stripping respects path-segment boundaries', () => {
	it('middleware blocks /app/admin with normal request', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/app/admin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '/app/admin should be blocked by middleware');
	});

	it('middleware blocks /appX/admin (single-character prefix extension)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/appX/admin');
		const response = await app.render(request);
		assert.notEqual(
			response.status,
			200,
			'/appX/admin should not resolve to the protected /admin route',
		);
	});

	it('middleware blocks /app2/admin (digit prefix extension)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/app2/admin');
		const response = await app.render(request);
		assert.notEqual(
			response.status,
			200,
			'/app2/admin should not resolve to the protected /admin route',
		);
	});

	it('middleware blocks /app-/admin (punctuation prefix extension)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/app-/admin');
		const response = await app.render(request);
		assert.notEqual(
			response.status,
			200,
			'/app-/admin should not resolve to the protected /admin route',
		);
	});
});
