import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { MiddlewareHandler } from '../../../dist/types/public/common.js';
import { App } from '../../../dist/core/app/app.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './test-helpers.ts';

/**
 * Security tests for double-slash URL prefix middleware authorization bypass.
 *
 * Vulnerability: A normalization inconsistency between route matching and middleware
 * URL construction allows bypassing middleware-based authorization by prepending an
 * extra `/` to the URL path (e.g., `//admin` instead of `/admin`).
 *
 * - `removeBase("//admin")` strips one slash → router matches `/admin`
 * - `context.url.pathname` preserves `//admin` → middleware `startsWith("/admin")` fails
 *
 * See: withastro/astro-security#5
 * CWE-647: Use of Non-Canonical URL Paths for Authorization Decisions
 * CWE-285: Improper Authorization
 */

const routeOptions: Parameters<typeof parseRoute>[1] = {
	config: { base: '/', trailingSlash: 'ignore' },
	pageExtensions: [],
} as any;

const adminRouteData = parseRoute('admin', routeOptions, {
	component: 'src/pages/admin.astro',
});

const dashboardRouteData = parseRoute('dashboard', routeOptions, {
	component: 'src/pages/dashboard.astro',
});

const publicRouteData = parseRoute('index.astro', routeOptions, {
	component: 'src/pages/index.astro',
});

const adminPage = createComponent((_result: any, _props: any, _slots: any) => {
	return render`<h1>Admin Panel</h1>`;
});

const dashboardPage = createComponent((_result: any, _props: any, _slots: any) => {
	return render`<h1>Dashboard</h1>`;
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
		dashboardRouteData.component,
		async () => ({
			page: async () => ({
				default: dashboardPage,
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
 * Middleware that blocks access to /admin and /dashboard routes,
 * as recommended in the official Astro authentication docs.
 */
function createAuthMiddleware() {
	return (async () => ({
		onRequest: (async (context, next) => {
			const protectedPaths = ['/admin', '/dashboard'];
			if (protectedPaths.some((p) => context.url.pathname.startsWith(p))) {
				return new Response('Forbidden', { status: 403 });
			}
			return next();
		}) satisfies MiddlewareHandler,
	})) as () => Promise<{ onRequest: MiddlewareHandler }>;
}

function createApp(middleware: ReturnType<typeof createAuthMiddleware>) {
	return new App(
		createManifest({
			routes: [
				createRouteInfo(adminRouteData),
				createRouteInfo(dashboardRouteData),
				createRouteInfo(publicRouteData),
			],
			pageMap: pageMap as any,
			middleware: middleware as any,
		}) as any,
	);
}

describe('Security: double-slash URL prefix middleware bypass', () => {
	it('middleware blocks /admin with normal request', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/admin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '/admin should be blocked by middleware');
	});

	it('middleware blocks //admin (double-slash bypass attempt)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com//admin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '//admin should also be blocked by middleware');
	});

	it('middleware blocks ///admin (triple-slash bypass attempt)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com///admin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '///admin should also be blocked by middleware');
	});

	it('middleware blocks //dashboard (double-slash on another protected route)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com//dashboard');
		const response = await app.render(request);
		assert.equal(response.status, 403, '//dashboard should also be blocked by middleware');
	});

	it('middleware blocks //admin/ (double-slash with trailing slash)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com//admin/');
		const response = await app.render(request);
		assert.equal(response.status, 403, '//admin/ should also be blocked by middleware');
	});

	it('public route is still accessible', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/ should be accessible');
		const html = await response.text();
		assert.match(html, /Public/);
	});
});
