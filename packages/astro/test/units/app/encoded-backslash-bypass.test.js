// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest } from './test-helpers.js';

/**
 * Tests that encoded backslash characters (%5C) in URL paths do not cause
 * a mismatch between what middleware sees and what the router matches.
 *
 * When %5C is decoded to \, the URL spec's pathname setter normalizes \ to /,
 * which can create unexpected double slashes in context.url.pathname.
 * The middleware then sees a different path than what the router matched.
 */

const routeOptions = /** @type {Parameters<typeof parseRoute>[1]} */ (
	/** @type {any} */ ({
		config: { base: '/', trailingSlash: 'ignore' },
		pageExtensions: [],
	})
);

// Static route for /users
const usersIndexRouteData = parseRoute('users/index.astro', routeOptions, {
	component: 'src/pages/users/index.astro',
});

// Dynamic route: /users/[slug]
const userSlugRouteData = parseRoute('users/[slug]', routeOptions, {
	component: 'src/pages/users/[slug].astro',
});

// Static admin route
const adminRouteData = parseRoute('admin', routeOptions, {
	component: 'src/pages/admin.astro',
});

const publicRouteData = parseRoute('index.astro', routeOptions, {
	component: 'src/pages/index.astro',
});

const usersIndexPage = createComponent(() => {
	return render`<h1>Users Index</h1>`;
});

const userSlugPage = createComponent(() => {
	return render`<h1>User Profile</h1>`;
});

const adminPage = createComponent(() => {
	return render`<h1>Admin Panel</h1>`;
});

const publicPage = createComponent(() => {
	return render`<h1>Public</h1>`;
});

const pageMap = new Map([
	[
		usersIndexRouteData.component,
		async () => ({
			page: async () => ({
				default: usersIndexPage,
			}),
		}),
	],
	[
		userSlugRouteData.component,
		async () => ({
			page: async () => ({
				default: userSlugPage,
			}),
		}),
	],
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
 * Middleware that blocks access to /users/admin path,
 * simulating authorization checks on dynamic routes.
 * @returns {() => Promise<{onRequest: import('../../../dist/types/public/common.js').MiddlewareHandler}>}
 */
function createAuthMiddleware() {
	return async () => ({
		onRequest: /** @type {import('../../../dist/types/public/common.js').MiddlewareHandler} */ (
			async (context, next) => {
				const pathname = context.url.pathname;
				if (pathname === '/users/admin' || pathname.startsWith('/users/admin/')) {
					return new Response('Forbidden', { status: 403 });
				}
				return next();
			}
		),
	});
}

/**
 * @param {ReturnType<typeof createAuthMiddleware>} middleware
 */
function createApp(middleware) {
	return new App(
		createManifest({
			routes: [
				{ routeData: usersIndexRouteData },
				{ routeData: userSlugRouteData },
				{ routeData: adminRouteData },
				{ routeData: publicRouteData },
			],
			pageMap,
			middleware,
		}),
	);
}

describe('URL normalization: encoded backslash handling in pathname', () => {
	it('middleware blocks /users/admin with normal request', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/users/admin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '/users/admin should be blocked by middleware');
	});

	it('middleware blocks /users/%5Cadmin (encoded backslash)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/users/%5Cadmin');
		const response = await app.render(request);
		// After decoding %5C to \, and URL normalization of \ to /,
		// this should become /users/admin which the middleware should block
		assert.equal(response.status, 403, '/users/%5Cadmin should be blocked by middleware');
	});

	it('middleware blocks /users/%5cadmin (lowercase hex encoded backslash)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/users/%5cadmin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '/users/%5cadmin should be blocked by middleware');
	});

	it('middleware blocks /users/%5C%5Cadmin (double encoded backslash)', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/users/%5C%5Cadmin');
		const response = await app.render(request);
		assert.equal(response.status, 403, '/users/%5C%5Cadmin should be blocked by middleware');
	});

	it('public route is still accessible', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/ should be accessible');
	});

	it('non-protected dynamic route is still accessible', async () => {
		const app = createApp(createAuthMiddleware());
		const request = new Request('http://example.com/users/john');
		const response = await app.render(request);
		assert.equal(response.status, 200, '/users/john should be accessible');
	});
});
