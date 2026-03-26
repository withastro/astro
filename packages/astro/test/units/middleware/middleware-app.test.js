// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createRouteData } from '../mocks.js';
import { createManifest } from '../app/test-helpers.js';

/**
 * Helper: creates an App with the given middleware and routes.
 * @param {object} opts
 * @param {import('astro').MiddlewareHandler} opts.onRequest - The middleware handler
 * @param {Array<{ routeData: any; component?: any }>} opts.routes - Route definitions
 * @param {Map} opts.pageMap - Component map
 * @param {string} [opts.base]
 */
function createAppWithMiddleware({ onRequest, routes, pageMap, base }) {
	const manifest = createManifest({
		routes: routes.map((r) => ({ routeData: r.routeData })),
		pageMap,
		base,
	});
	// Override the middleware field — createManifest sets it to undefined,
	// but the pipeline reads it from manifest.middleware
	manifest.middleware = () => ({ onRequest });
	return new App(manifest);
}

// ----- Shared route data -----

const indexRouteData = createRouteData({ route: '/' });
const loremRouteData = createRouteData({ route: '/lorem' });
const secondRouteData = createRouteData({ route: '/second' });
const redirectRouteData = createRouteData({ route: '/redirect' });
const rewriteRouteData = createRouteData({ route: '/rewrite' });
const adminRouteData = createRouteData({ route: '/admin' });
const apiRouteData = createRouteData({ route: '/api/endpoint', type: 'endpoint' });
const throwRouteData = createRouteData({ route: '/throw' });
const notFoundRouteData = createRouteData({ route: '/404' });
const serverErrorRouteData = createRouteData({ route: '/500' });
const spacesRouteData = createRouteData({
	route: '/path with spaces',
	pathname: '/path with spaces',
});

// ----- Shared page components -----

const simplePage = (localKey = 'name') =>
	createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		return render`<p>${Astro.locals[localKey]}</p>`;
	});

const notFoundPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<html><head><title>Error</title></head><body><p>${Astro.locals.name}</p></body></html>`;
});

const serverErrorPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<html><head><title>500</title></head><body><p>${Astro.locals.name}</p></body></html>`;
});

const throwingPage = createComponent(() => {
	throw new Error('page threw an error');
});

const cookiePage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	Astro.cookies.set('from-component', 'component-value');
	return render`<p>cookies</p>`;
});

// ----- Tests -----

describe('Middleware via App.render()', () => {
	describe('locals', () => {
		it('should render locals data set by middleware', async () => {
			const onRequest = async (ctx, next) => {
				ctx.locals.name = 'bar';
				return next();
			};
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: simplePage() }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: indexRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/'));
			const html = await response.text();

			assert.match(html, /<p>bar<\/p>/);
		});

		it('should change locals data based on URL', async () => {
			const onRequest = async (ctx, next) => {
				if (ctx.url.pathname === '/lorem') {
					ctx.locals.name = 'ipsum';
				} else {
					ctx.locals.name = 'bar';
				}
				return next();
			};
			const page = simplePage();
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: page }) })],
				[loremRouteData.component, async () => ({ page: async () => ({ default: page }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: indexRouteData }, { routeData: loremRouteData }],
				pageMap,
			});

			const indexRes = await app.render(new Request('http://localhost/'));
			assert.match(await indexRes.text(), /<p>bar<\/p>/);

			const loremRes = await app.render(new Request('http://localhost/lorem'));
			assert.match(await loremRes.text(), /<p>ipsum<\/p>/);
		});
	});

	describe('sequence', () => {
		it('should call a second middleware in a sequence via manifest', async () => {
			// We test sequence by making the manifest middleware itself a sequence.
			// sequence() is already tested in sequence.test.js; here we verify it works
			// when wired through the App pipeline.
			const { sequence } = await import('../../../dist/core/middleware/sequence.js');

			const first = async (ctx, next) => {
				ctx.locals.name = 'first';
				return next();
			};
			const second = async (ctx, next) => {
				if (ctx.url.pathname === '/second') {
					ctx.locals.name = 'second';
				}
				return next();
			};
			const combined = sequence(first, second);
			const page = simplePage();
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: page }) })],
				[secondRouteData.component, async () => ({ page: async () => ({ default: page }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest: combined,
				routes: [{ routeData: indexRouteData }, { routeData: secondRouteData }],
				pageMap,
			});

			const indexRes = await app.render(new Request('http://localhost/'));
			assert.match(await indexRes.text(), /<p>first<\/p>/);

			const secondRes = await app.render(new Request('http://localhost/second'));
			assert.match(await secondRes.text(), /<p>second<\/p>/);
		});
	});

	describe('short-circuit responses', () => {
		it('should successfully create a new response bypassing the page', async () => {
			const onRequest = async (ctx, next) => {
				if (ctx.url.pathname === '/rewrite') {
					return new Response('<span>New content!!</span>', { status: 200 });
				}
				return next();
			};
			const pageMap = new Map([
				[
					rewriteRouteData.component,
					async () => ({ page: async () => ({ default: simplePage() }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: rewriteRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/rewrite'));

			assert.equal(response.status, 200);
			assert.equal(await response.text(), '<span>New content!!</span>');
		});

		it('should return a new response that is a 500', async () => {
			const onRequest = async (ctx, next) => {
				if (ctx.url.pathname === '/broken-500') {
					return new Response(null, { status: 500 });
				}
				return next();
			};
			// We need a route that matches /broken-500
			const brokenRoute = createRouteData({ route: '/broken-500' });
			const pageMap = new Map([
				[brokenRoute.component, async () => ({ page: async () => ({ default: simplePage() }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: brokenRoute }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/broken-500'));

			assert.equal(response.status, 500);
		});

		it('should return 200 if middleware returns a 200 Response for a non-existent route', async () => {
			const onRequest = async (ctx, next) => {
				if (ctx.url.pathname === '/no-route-but-200') {
					return new Response("It's OK!", { status: 200 });
				}
				return next();
			};
			// No route matches /no-route-but-200, but middleware short-circuits
			const pageMap = new Map([
				[
					notFoundRouteData.component,
					async () => ({ page: async () => ({ default: notFoundPage }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: notFoundRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/no-route-but-200'));

			assert.equal(response.status, 200);
			assert.equal(await response.text(), "It's OK!");
		});
	});

	describe('pass-through middleware', () => {
		it('should render the page normally if middleware only calls next()', async () => {
			const onRequest = async (_ctx, next) => {
				return next();
			};
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: simplePage() }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: indexRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/'), {
				locals: { name: 'passthrough' },
			});
			const html = await response.text();

			assert.equal(response.status, 200);
			assert.match(html, /<p>passthrough<\/p>/);
		});
	});

	describe('error handling', () => {
		it('should throw when middleware returns undefined without calling next()', async () => {
			const onRequest = async () => {
				return undefined;
			};
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: simplePage() }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: indexRouteData }],
				pageMap,
			});

			// In the App pipeline, errors in middleware result in a 500 response
			const response = await app.render(new Request('http://localhost/'));
			assert.equal(response.status, 500);
		});

		it('should render 500.astro when middleware throws an error', async () => {
			const onRequest = async (ctx, next) => {
				if (ctx.url.pathname === '/throw') {
					throw new Error('middleware error');
				}
				return next();
			};
			const pageMap = new Map([
				[throwRouteData.component, async () => ({ page: async () => ({ default: throwingPage }) })],
				[
					serverErrorRouteData.component,
					async () => ({ page: async () => ({ default: serverErrorPage }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: throwRouteData }, { routeData: serverErrorRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/throw'));

			assert.equal(response.status, 500);
		});
	});

	describe('redirect', () => {
		it('should successfully redirect to another page', async () => {
			const onRequest = async (ctx, next) => {
				if (ctx.url.pathname === '/redirect') {
					return ctx.redirect('/', 302);
				}
				return next();
			};
			const pageMap = new Map([
				[
					redirectRouteData.component,
					async () => ({ page: async () => ({ default: simplePage() }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: redirectRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/redirect'));

			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/');
		});
	});

	describe('cookies', () => {
		it('should allow middleware to set cookies', async () => {
			const onRequest = async (ctx, next) => {
				ctx.cookies.set('foo', 'bar');
				return next();
			};
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: simplePage() }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: indexRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/'), {
				locals: { name: 'test' },
				addCookieHeader: true,
			});

			const setCookie = response.headers.get('set-cookie');
			assert.ok(setCookie);
			assert.match(setCookie, /foo=bar/);
		});

		it('should forward cookies set in a component when middleware returns a new response', async () => {
			const onRequest = async (_ctx, next) => {
				const response = await next();
				const html = await response.text();
				return new Response(html, { status: 200, headers: response.headers });
			};
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: cookiePage }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: indexRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/'), {
				addCookieHeader: true,
			});
			const setCookie = response.headers.get('set-cookie');

			assert.ok(setCookie);
			assert.match(setCookie, /from-component=component-value/);
		});
	});

	describe('response modification', () => {
		it('should be able to clone the response and modify it', async () => {
			const onRequest = async (_ctx, next) => {
				const response = await next();
				const cloned = response.clone();
				const html = await cloned.text();
				const modified = html.replace('testing', 'it works');
				return new Response(modified, { status: 200, headers: response.headers });
			};
			const testPage = createComponent(() => {
				return render`<p>testing</p>`;
			});
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: testPage }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: indexRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/'));
			const html = await response.text();

			assert.match(html, /it works/);
			assert.ok(!html.includes('testing'));
		});
	});

	describe('API endpoints', () => {
		it('should correctly work for API endpoints that return a Response object', async () => {
			const onRequest = async (_ctx, next) => {
				return next();
			};
			const pageMap = new Map([
				[
					apiRouteData.component,
					async () => ({
						page: async () => ({
							GET: async () =>
								new Response(JSON.stringify({ name: 'test' }), {
									headers: { 'Content-Type': 'application/json' },
								}),
						}),
					}),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: apiRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/api/endpoint'));

			assert.equal(response.status, 200);
			assert.equal(response.headers.get('Content-Type'), 'application/json');
			const body = await response.json();
			assert.equal(body.name, 'test');
		});

		it('should correctly manipulate the response coming from API endpoints', async () => {
			const onRequest = async (ctx, next) => {
				if (ctx.url.pathname === '/api/endpoint') {
					const response = await next();
					const data = await response.json();
					data.name = 'REDACTED';
					return new Response(JSON.stringify(data), {
						headers: response.headers,
					});
				}
				return next();
			};
			const pageMap = new Map([
				[
					apiRouteData.component,
					async () => ({
						page: async () => ({
							GET: async () =>
								new Response(JSON.stringify({ name: 'secret', value: 42 }), {
									headers: { 'Content-Type': 'application/json' },
								}),
						}),
					}),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: apiRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/api/endpoint'));
			const body = await response.json();

			assert.equal(body.name, 'REDACTED');
			assert.equal(body.value, 42);
		});
	});

	describe('404 handling', () => {
		it('should correctly call middleware for 404 routes', async () => {
			const onRequest = async (ctx, next) => {
				ctx.locals.name = 'bar';
				return next();
			};
			const pageMap = new Map([
				[
					notFoundRouteData.component,
					async () => ({ page: async () => ({ default: notFoundPage }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: notFoundRouteData }],
				pageMap,
			});

			// Request a URL that doesn't match any route — falls back to 404
			const response = await app.render(new Request('http://localhost/unknown-page'));

			assert.equal(response.status, 404);
			const html = await response.text();
			assert.match(html, /bar/);
		});
	});

	describe('path encoding and auth', () => {
		/**
		 * Auth middleware that protects /admin
		 */
		const authMiddleware = async (ctx, next) => {
			if (ctx.url.pathname === '/admin') {
				const authToken = ctx.request.headers.get('Authorization');
				if (!authToken) {
					return ctx.redirect('/');
				}
			}
			return next();
		};

		function createAuthApp() {
			const page = simplePage();
			const pageMap = new Map([
				[adminRouteData.component, async () => ({ page: async () => ({ default: page }) })],
				[indexRouteData.component, async () => ({ page: async () => ({ default: page }) })],
				[
					notFoundRouteData.component,
					async () => ({ page: async () => ({ default: notFoundPage }) }),
				],
			]);
			return createAppWithMiddleware({
				onRequest: authMiddleware,
				routes: [
					{ routeData: adminRouteData },
					{ routeData: indexRouteData },
					{ routeData: notFoundRouteData },
				],
				pageMap,
			});
		}

		it('should allow accessing /admin with valid auth header', async () => {
			const app = createAuthApp();
			const response = await app.render(
				new Request('http://localhost/admin', {
					headers: { Authorization: 'Bearer token123' },
				}),
				{ locals: { name: 'admin-content' } },
			);

			assert.equal(response.status, 200);
		});

		it('should redirect /admin without auth header', async () => {
			const app = createAuthApp();
			const response = await app.render(new Request('http://localhost/admin'));

			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/');
		});

		it('should handle requests with spaces in path correctly', async () => {
			const onRequest = async (_ctx, next) => {
				return next();
			};
			const spacesPage = createComponent(() => {
				return render`<p>spaces page</p>`;
			});
			const pageMap = new Map([
				[spacesRouteData.component, async () => ({ page: async () => ({ default: spacesPage }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: spacesRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/path%20with%20spaces'));

			assert.equal(response.status, 200);
		});
	});

	describe('cookies on error pages', () => {
		it('should preserve cookies set by middleware when returning Response(null, { status: 404 })', async () => {
			// Middleware sets a cookie and returns 404 with null body (common auth guard pattern)
			const onRequest = async (ctx, next) => {
				ctx.cookies.set('session', 'abc123', { path: '/' });
				if (ctx.url.pathname.startsWith('/api/guarded')) {
					return new Response(null, { status: 404 });
				}
				return next();
			};

			const guardedRouteData = createRouteData({
				route: '/api/guarded/[...path]',
				pathname: undefined,
				segments: undefined,
			});
			// Override for spread route
			guardedRouteData.params = ['...path'];
			guardedRouteData.pattern = /^\/api\/guarded(?:\/(.*))?$/;
			guardedRouteData.pathname = undefined;
			guardedRouteData.segments = [
				[{ content: 'api', dynamic: false, spread: false }],
				[{ content: 'guarded', dynamic: false, spread: false }],
				[{ content: '...path', dynamic: true, spread: true }],
			];

			const pageMap = new Map([
				[
					guardedRouteData.component,
					async () => ({
						page: async () => ({
							default: simplePage(),
						}),
					}),
				],
				[
					notFoundRouteData.component,
					async () => ({ page: async () => ({ default: notFoundPage }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: guardedRouteData }, { routeData: notFoundRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/api/guarded/secret'), {
				addCookieHeader: true,
			});

			assert.equal(response.status, 404);
			const setCookie = response.headers.get('set-cookie');
			assert.ok(setCookie, 'Expected Set-Cookie header to be present on 404 error page response');
			assert.match(setCookie, /session=abc123/);
		});

		it('should preserve cookies set by middleware when returning Response(null, { status: 500 })', async () => {
			const onRequest = async (ctx, next) => {
				ctx.cookies.set('csrf', 'token456', { path: '/' });
				if (ctx.url.pathname.startsWith('/api/error')) {
					return new Response(null, { status: 500 });
				}
				return next();
			};

			const errorRouteData = createRouteData({
				route: '/api/error/[...path]',
				pathname: undefined,
				segments: undefined,
			});
			errorRouteData.params = ['...path'];
			errorRouteData.pattern = /^\/api\/error(?:\/(.*))?$/;
			errorRouteData.pathname = undefined;
			errorRouteData.segments = [
				[{ content: 'api', dynamic: false, spread: false }],
				[{ content: 'error', dynamic: false, spread: false }],
				[{ content: '...path', dynamic: true, spread: true }],
			];

			const pageMap = new Map([
				[
					errorRouteData.component,
					async () => ({
						page: async () => ({
							default: simplePage(),
						}),
					}),
				],
				[
					serverErrorRouteData.component,
					async () => ({ page: async () => ({ default: serverErrorPage }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: errorRouteData }, { routeData: serverErrorRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/api/error/test'), {
				addCookieHeader: true,
			});

			assert.equal(response.status, 500);
			const setCookie = response.headers.get('set-cookie');
			assert.ok(setCookie, 'Expected Set-Cookie header to be present on 500 error page response');
			assert.match(setCookie, /csrf=token456/);
		});

		it('should preserve multiple cookies from sequenced middleware during error page rerouting', async () => {
			const onRequest = async (ctx, next) => {
				ctx.cookies.set('session', 'abc123', { path: '/' });
				ctx.cookies.set('csrf', 'token456', { path: '/' });
				if (ctx.url.pathname.startsWith('/api/guarded')) {
					ctx.cookies.set('auth_attempt', 'failed', { path: '/' });
					return new Response(null, { status: 404 });
				}
				return next();
			};

			const guardedRouteData = createRouteData({
				route: '/api/guarded/[...path]',
				pathname: undefined,
				segments: undefined,
			});
			guardedRouteData.params = ['...path'];
			guardedRouteData.pattern = /^\/api\/guarded(?:\/(.*))?$/;
			guardedRouteData.pathname = undefined;
			guardedRouteData.segments = [
				[{ content: 'api', dynamic: false, spread: false }],
				[{ content: 'guarded', dynamic: false, spread: false }],
				[{ content: '...path', dynamic: true, spread: true }],
			];

			const pageMap = new Map([
				[
					guardedRouteData.component,
					async () => ({
						page: async () => ({
							default: simplePage(),
						}),
					}),
				],
				[
					notFoundRouteData.component,
					async () => ({ page: async () => ({ default: notFoundPage }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: guardedRouteData }, { routeData: notFoundRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/api/guarded/secret'), {
				addCookieHeader: true,
			});

			assert.equal(response.status, 404);
			const setCookies = response.headers.getSetCookie();
			const cookieValues = setCookies.join(', ');
			assert.ok(
				cookieValues.includes('session=abc123'),
				'Expected session cookie in Set-Cookie headers',
			);
			assert.ok(
				cookieValues.includes('csrf=token456'),
				'Expected csrf cookie in Set-Cookie headers',
			);
			assert.ok(
				cookieValues.includes('auth_attempt=failed'),
				'Expected auth_attempt cookie in Set-Cookie headers',
			);
		});
	});

	describe('framing headers on error pages', () => {
		it('should not preserve Content-Length from middleware when rendering 404 error page', async () => {
			// Middleware calls next(), then decides to return 404 with a stale Content-Length header.
			// On re-render for the error page, middleware passes the response through unchanged.
			let callCount = 0;
			const onRequest = async (ctx, next) => {
				callCount++;
				const response = await next();
				if (callCount === 1 && ctx.url.pathname.startsWith('/api/guarded')) {
					return new Response(null, {
						status: 404,
						headers: { 'Content-Length': '999', 'X-Custom': 'keep-me' },
					});
				}
				return response;
			};

			const guardedRouteData = createRouteData({
				route: '/api/guarded/[...path]',
				pathname: undefined,
				segments: undefined,
			});
			guardedRouteData.params = ['...path'];
			guardedRouteData.pattern = /^\/api\/guarded(?:\/(.*))?$/;
			guardedRouteData.pathname = undefined;
			guardedRouteData.segments = [
				[{ content: 'api', dynamic: false, spread: false }],
				[{ content: 'guarded', dynamic: false, spread: false }],
				[{ content: '...path', dynamic: true, spread: true }],
			];

			const pageMap = new Map([
				[
					guardedRouteData.component,
					async () => ({
						page: async () => ({
							default: simplePage(),
						}),
					}),
				],
				[
					notFoundRouteData.component,
					async () => ({ page: async () => ({ default: notFoundPage }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: guardedRouteData }, { routeData: notFoundRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/api/guarded/secret'));

			assert.equal(response.status, 404);
			// Content-Length from middleware's original response must not leak into the error page response
			assert.equal(
				response.headers.get('Content-Length'),
				null,
				'Content-Length from middleware should be stripped during error page merge',
			);
			// Non-framing custom headers should still be preserved
			assert.equal(response.headers.get('X-Custom'), 'keep-me');
		});

		it('should not preserve Transfer-Encoding from middleware when rendering 500 error page', async () => {
			let callCount = 0;
			const onRequest = async (ctx, next) => {
				callCount++;
				const response = await next();
				if (callCount === 1 && ctx.url.pathname.startsWith('/api/error')) {
					return new Response(null, {
						status: 500,
						headers: { 'Transfer-Encoding': 'chunked', 'X-Error-Source': 'middleware' },
					});
				}
				return response;
			};

			const errorRouteData = createRouteData({
				route: '/api/error/[...path]',
				pathname: undefined,
				segments: undefined,
			});
			errorRouteData.params = ['...path'];
			errorRouteData.pattern = /^\/api\/error(?:\/(.*))?$/;
			errorRouteData.pathname = undefined;
			errorRouteData.segments = [
				[{ content: 'api', dynamic: false, spread: false }],
				[{ content: 'error', dynamic: false, spread: false }],
				[{ content: '...path', dynamic: true, spread: true }],
			];

			const pageMap = new Map([
				[
					errorRouteData.component,
					async () => ({
						page: async () => ({
							default: simplePage(),
						}),
					}),
				],
				[
					serverErrorRouteData.component,
					async () => ({ page: async () => ({ default: serverErrorPage }) }),
				],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: errorRouteData }, { routeData: serverErrorRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/api/error/test'));

			assert.equal(response.status, 500);
			// Transfer-Encoding from middleware's original response must not leak into the error page response
			assert.equal(
				response.headers.get('Transfer-Encoding'),
				null,
				'Transfer-Encoding from middleware should be stripped during error page merge',
			);
			// Non-framing custom headers should still be preserved
			assert.equal(response.headers.get('X-Error-Source'), 'middleware');
		});
	});

	describe('middleware with custom headers', () => {
		it('should correctly set custom headers in middleware', async () => {
			const onRequest = async (_ctx, next) => {
				const response = await next();
				response.headers.set('X-Custom-Header', 'custom-value');
				return response;
			};
			const pageMap = new Map([
				[indexRouteData.component, async () => ({ page: async () => ({ default: simplePage() }) })],
			]);
			const app = createAppWithMiddleware({
				onRequest,
				routes: [{ routeData: indexRouteData }],
				pageMap,
			});

			const response = await app.render(new Request('http://localhost/'), {
				locals: { name: 'test' },
			});

			assert.equal(response.headers.get('X-Custom-Header'), 'custom-value');
		});
	});
});
