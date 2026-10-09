import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import type { MiddlewareHandler } from '../../../dist/types/public/common.js';
import { createManifest, createRouteInfo } from './test-helpers.ts';

/**
 * Tests that encoded backslash characters (%5C) in URL paths do not cause
 * a mismatch between what middleware sees and what the router matches.
 *
 * When %5C is decoded to \, the URL spec's pathname setter normalizes \ to /,
 * which can create unexpected double slashes in context.url.pathname.
 * The middleware then sees a different path than what the router matched.
 */

const routeOptions: Parameters<typeof parseRoute>[1] = {
	config: { base: '/', trailingSlash: 'ignore' },
	pageExtensions: [],
} as any;

// Dynamic route: /users/[slug]
const userSlugRouteData = parseRoute('users/[slug]', routeOptions, {
	component: 'src/pages/users/[slug].astro',
});

const publicRouteData = parseRoute('index.astro', routeOptions, {
	component: 'src/pages/index.astro',
});

const page = createComponent((_result: any, _props: any, _slots: any) => {
	return render`<h1>Page</h1>`;
});

const pageModule = async () => ({
	page: async () => ({
		default: page,
	}),
});

const pageMap = new Map([
	[userSlugRouteData.component, pageModule],
	[publicRouteData.component, pageModule],
]);

/**
 * Middleware that blocks access to /users/admin path,
 * simulating authorization checks on dynamic routes.
 */
const middleware = (async () => ({
	onRequest: (async (context, next) => {
		const pathname = context.url.pathname;
		if (pathname === '/users/admin' || pathname.startsWith('/users/admin/')) {
			return new Response('Forbidden', { status: 403 });
		}
		return next();
	}) satisfies MiddlewareHandler,
})) as () => Promise<{ onRequest: MiddlewareHandler }>;

const app = new App(
	createManifest({
		routes: [createRouteInfo(userSlugRouteData), createRouteInfo(publicRouteData)],
		pageMap: pageMap as any,
		middleware: middleware as any,
	}) as any,
);

describe('URL normalization: encoded backslash handling in pathname', () => {
	it('middleware blocks /users/admin with normal request', async () => {
		const request = new Request('http://example.com/users/admin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '/users/admin should be blocked by middleware');
	});

	it('middleware blocks /users/%5Cadmin (encoded backslash)', async () => {
		const request = new Request('http://example.com/users/%5Cadmin');
		const response = await app.render(request);
		// After decoding %5C to \, and URL normalization of \ to /,
		// this should become /users/admin which the middleware should block
		assert.equal(response.status, 403, '/users/%5Cadmin should be blocked by middleware');
	});

	it('middleware blocks /users/%5cadmin (lowercase hex encoded backslash)', async () => {
		const request = new Request('http://example.com/users/%5cadmin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '/users/%5cadmin should be blocked by middleware');
	});

	it('middleware blocks /users/%5C%5Cadmin (double encoded backslash)', async () => {
		const request = new Request('http://example.com/users/%5C%5Cadmin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '/users/%5C%5Cadmin should be blocked by middleware');
	});

	it('public route is still accessible', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/ should be accessible');
	});

	it('non-protected dynamic route is still accessible', async () => {
		const request = new Request('http://example.com/users/john');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/users/john should be accessible');
	});
});
