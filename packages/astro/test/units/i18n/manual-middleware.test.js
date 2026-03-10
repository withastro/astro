import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { requestHasLocale, redirectToDefaultLocale, notFound } from '../../../dist/i18n/index.js';
import { createManualRoutingContext, createMiddlewarePayload } from './test-helpers.js';
import { createMockNext } from '../test-utils.js';

describe('Custom Middleware with Allowlist Pattern', () => {
	describe('allowlist bypasses i18n routing', () => {
		it('should allow /help to bypass locale check', async () => {
			const allowList = new Set(['/help', '/help/']);
			const context = createManualRoutingContext({ pathname: '/help' });
			const next = createMockNext(new Response('Help page'));

			// Middleware logic: if allowlist matches, call next()
			let response;
			if (allowList.has(context.url.pathname)) {
				response = await next();
			}

			assert.ok(next.called);
			assert.equal(await response.text(), 'Help page');
		});

		it('should allow /about if in allowlist', async () => {
			const allowList = new Set(['/about']);
			const context = createManualRoutingContext({ pathname: '/about' });
			const next = createMockNext(new Response('About page'));

			let response;
			if (allowList.has(context.url.pathname)) {
				response = await next();
			}

			assert.ok(next.called);
			assert.equal(await response.text(), 'About page');
		});

		it('should not call next() for non-allowlisted paths', async () => {
			const allowList = new Set(['/help']);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const next = createMockNext();

			let response = null;
			if (!allowList.has(context.url.pathname)) {
				// Path not in allowlist, don't call next
				response = new Response(null, { status: 404 });
			}

			assert.equal(next.called, false);
			assert.ok(response);
			assert.equal(response.status, 404);
		});
	});

	describe('paths with locales proceed to next()', () => {
		it('should call next() when requestHasLocale returns true', async () => {
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/en/blog' });
			const next = createMockNext(new Response('Blog page'));

			let response;
			if (hasLocale(context)) {
				response = await next();
			}

			assert.ok(next.called);
			assert.equal(await response.text(), 'Blog page');
		});

		it('should call next() for /spanish with locale object', async () => {
			const locales = ['en', { path: 'spanish', codes: ['es'] }];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/spanish' });
			const next = createMockNext(new Response('Spanish page'));

			let response = null;
			if (hasLocale(context)) {
				response = await next();
			}

			assert.ok(next.called);
			assert.ok(response);
		});

		it('should not call next() for paths without locale', async () => {
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const next = createMockNext();

			let response = null;
			if (hasLocale(context)) {
				response = await next();
			} else {
				response = new Response(null, { status: 404 });
			}

			assert.equal(next.called, false);
			assert.ok(response);
			assert.equal(response.status, 404);
		});
	});

	describe('root path redirects to default locale', () => {
		it('should redirect / to default locale without calling next()', async () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });
			const next = createMockNext();

			let response;
			if (context.url.pathname === '/') {
				response = redirect(context);
			} else {
				response = await next();
			}

			assert.equal(next.called, false); // next() should NOT be called
			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should redirect with custom status code', async () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 301);

			assert.equal(response.status, 301);
		});
	});

	describe('unknown paths return 404', () => {
		it('should return 404 for unknown paths without calling next()', async () => {
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/unknown' });
			const next = createMockNext();

			let response = null;
			if (hasLocale(context)) {
				response = await next();
			} else if (context.url.pathname !== '/') {
				response = new Response(null, { status: 404 });
			}

			assert.equal(next.called, false);
			assert.ok(response);
			assert.equal(response.status, 404);
		});

		it('should return 404 for /blog without locale', async () => {
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/blog' });

			let response = null;
			if (!hasLocale(context) && context.url.pathname !== '/') {
				response = new Response(null, { status: 404 });
			}

			assert.ok(response);
			assert.equal(response.status, 404);
		});
	});

	describe('special 404 route handling', () => {
		it('should redirect /redirect-me to default locale', async () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/redirect-me' });

			// Middleware logic from fixture
			let response = null;
			if (context.url.pathname === '/' || context.url.pathname === '/redirect-me') {
				response = redirect(context);
			}

			assert.ok(response);
			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/en/');
		});
	});
});

describe('Middleware Flow Control', () => {
	describe('decision tree execution order', () => {
		it('should check allowlist first, then locale, then root, then 404', async () => {
			const allowList = new Set(['/help']);
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);

			// Test function that mimics the middleware from fixture
			async function middleware(pathname) {
				const context = createManualRoutingContext({ pathname });
				const next = createMockNext(new Response('Page content'));

				// Step 1: Check allowlist
				if (allowList.has(context.url.pathname)) {
					return { response: await next(), calledNext: true };
				}

				// Step 2: Check if has locale
				if (hasLocale(context)) {
					return { response: await next(), calledNext: true };
				}

				// Step 3: Check if root or special path
				if (context.url.pathname === '/' || context.url.pathname === '/redirect-me') {
					return { response: redirect(context), calledNext: false };
				}

				// Step 4: Return 404
				return { response: new Response(null, { status: 404 }), calledNext: false };
			}

			// Test allowlist path
			const result1 = await middleware('/help');
			assert.equal(result1.calledNext, true);
			assert.equal(await result1.response.text(), 'Page content');

			// Test locale path
			const result2 = await middleware('/en/blog');
			assert.equal(result2.calledNext, true);

			// Test root path
			const result3 = await middleware('/');
			assert.equal(result3.calledNext, false);
			assert.equal(result3.response.status, 302);

			// Test unknown path
			const result4 = await middleware('/unknown');
			assert.equal(result4.calledNext, false);
			assert.equal(result4.response.status, 404);
		});

		it('should short-circuit on allowlist match', async () => {
			const allowList = new Set(['/help']);
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/help' });
			const next = createMockNext(new Response('Help page'));

			// Middleware should return immediately after allowlist check
			let response = null;
			if (allowList.has(context.url.pathname)) {
				response = await next();
			} else if (hasLocale(context)) {
				// This should not execute
				assert.fail('Should not check locale after allowlist match');
			}

			assert.ok(next.called);
			assert.ok(response);
		});

		it('should short-circuit on locale match', async () => {
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/en/blog' });
			const next = createMockNext(new Response('Blog'));

			let response = null;
			if (hasLocale(context)) {
				response = await next();
			} else if (context.url.pathname === '/') {
				// This should not execute
				assert.fail('Should not check root after locale match');
			}

			assert.ok(next.called);
			assert.ok(response);
		});
	});

	describe('early return patterns', () => {
		it('should return immediately when allowlist matches', async () => {
			const allowList = new Set(['/help']);
			const context = createManualRoutingContext({ pathname: '/help' });
			const next = createMockNext(new Response('Help'));

			let executedNext = false;
			let executedOther = false;

			let response = null;
			if (allowList.has(context.url.pathname)) {
				executedNext = true;
				response = await next();
				// Early return, nothing after should execute
			} else {
				executedOther = true;
			}

			assert.equal(executedNext, true);
			assert.equal(executedOther, false);
			assert.ok(response);
		});

		it('should not call next() when redirecting', async () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });
			const next = createMockNext();

			let response;
			if (context.url.pathname === '/') {
				response = redirect(context);
				// Should return here, not call next()
			} else {
				response = await next();
			}

			assert.equal(next.called, false);
			assert.equal(response.status, 302);
		});

		it('should not call next() when returning 404', async () => {
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/unknown' });
			const next = createMockNext();

			let response = null;
			if (hasLocale(context)) {
				response = await next();
			} else {
				response = new Response(null, { status: 404 });
				// Should return here, not call next()
			}

			assert.equal(next.called, false);
			assert.ok(response);
			assert.equal(response.status, 404);
		});
	});

	describe('response propagation', () => {
		it('should propagate response from next() when locale found', async () => {
			const locales = ['en', 'es'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/en/blog' });
			const expectedResponse = new Response('Blog content', {
				status: 200,
				headers: { 'X-Custom': 'value' },
			});
			const next = createMockNext(expectedResponse);

			let response;
			if (hasLocale(context)) {
				response = await next();
			}

			assert.equal(response, expectedResponse);
			assert.equal(response.headers.get('X-Custom'), 'value');
		});

		it('should propagate custom response from allowlist route', async () => {
			const allowList = new Set(['/api/health']);
			const context = createManualRoutingContext({ pathname: '/api/health' });
			const healthResponse = new Response(JSON.stringify({ status: 'ok' }), {
				headers: { 'Content-Type': 'application/json' },
			});
			const next = createMockNext(healthResponse);

			let response;
			if (allowList.has(context.url.pathname)) {
				response = await next();
			}

			assert.equal(response.headers.get('Content-Type'), 'application/json');
			assert.equal(await response.text(), JSON.stringify({ status: 'ok' }));
		});
	});
});

describe('Complete Middleware Scenarios', () => {
	describe('fixture middleware pattern', () => {
		/**
		 * This replicates the exact middleware from the i18n-routing-manual fixture
		 */
		async function fixtureMiddleware(pathname) {
			const allowList = new Set(['/help', '/help/']);
			const locales = ['en', 'pt', 'it', { path: 'spanish', codes: ['es', 'es-ar'] }];
			const payload = createMiddlewarePayload({
				defaultLocale: 'en',
				locales,
			});

			const hasLocale = requestHasLocale(locales);
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname });
			const next = createMockNext(new Response('Page content'));

			// Replicate exact middleware logic
			if (allowList.has(context.url.pathname)) {
				return await next();
			}
			if (hasLocale(context)) {
				return await next();
			}
			if (context.url.pathname === '/' || context.url.pathname === '/redirect-me') {
				return redirect(context);
			}
			return new Response(null, { status: 404 });
		}

		it('should handle all fixture test cases correctly', async () => {
			// Test case 1: Root redirects to /en/
			const response1 = await fixtureMiddleware('/');
			assert.equal(response1.status, 302);
			assert.equal(response1.headers.get('Location'), '/en/');

			// Test case 2: /help is allowed (not i18n)
			const response2 = await fixtureMiddleware('/help');
			assert.equal(await response2.text(), 'Page content');

			// Test case 3: /en/blog has locale
			const response3 = await fixtureMiddleware('/en/blog');
			assert.equal(await response3.text(), 'Page content');

			// Test case 4: /pt/start has locale
			const response4 = await fixtureMiddleware('/pt/start');
			assert.equal(await response4.text(), 'Page content');

			// Test case 5: /spanish has locale (object path)
			const response5 = await fixtureMiddleware('/spanish');
			assert.equal(await response5.text(), 'Page content');

			// Test case 6: /redirect-me redirects like root
			const response6 = await fixtureMiddleware('/redirect-me');
			assert.equal(response6.status, 302);
			assert.equal(response6.headers.get('Location'), '/en/');

			// Test case 7: Unknown path returns 404
			const response7 = await fixtureMiddleware('/unknown');
			assert.equal(response7.status, 404);

			// Test case 8: /blog without locale returns 404
			const response8 = await fixtureMiddleware('/blog');
			assert.equal(response8.status, 404);
		});

		it('should not match locale codes for locale objects', async () => {
			// /es should NOT match the spanish locale object (only /spanish matches)
			const response = await fixtureMiddleware('/es');
			assert.equal(response.status, 404);
		});

		it('should handle trailing slash in allowlist', async () => {
			const response = await fixtureMiddleware('/help/');
			assert.equal(await response.text(), 'Page content');
		});
	});

	describe('middleware with base path', () => {
		async function middlewareWithBase(pathname, base = '/blog') {
			const locales = ['en', 'es'];
			const payload = createMiddlewarePayload({
				base,
				defaultLocale: 'en',
				locales,
			});

			const hasLocale = requestHasLocale(locales);
			const redirect = redirectToDefaultLocale(payload);
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname });
			const next = createMockNext(new Response('Page'));

			if (hasLocale(context)) {
				return await next();
			}
			if (context.url.pathname === base || context.url.pathname === base + '/') {
				return redirect(context);
			}
			const result = notFoundFn(context);
			return result || new Response(null, { status: 404 });
		}

		it('should redirect base path to base + locale', async () => {
			const response = await middlewareWithBase('/blog');
			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/blog/en/');
		});

		it('should allow paths with locale under base', async () => {
			const response = await middlewareWithBase('/blog/en/post');
			assert.equal(await response.text(), 'Page');
		});

		it('should return 404 for paths without locale under base', async () => {
			const response = await middlewareWithBase('/blog/about');
			assert.equal(response.status, 404);
		});
	});

	describe('middleware with custom responses', () => {
		it('should allow custom response from middleware before calling next()', async () => {
			const allowList = new Set(['/api/status']);
			const context = createManualRoutingContext({ pathname: '/api/status' });
			const next = createMockNext();

			let response;
			if (allowList.has(context.url.pathname)) {
				// Return custom JSON response without calling next()
				response = new Response(JSON.stringify({ status: 'healthy' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} else {
				response = await next();
			}

			assert.equal(next.called, false);
			assert.equal(response.status, 200);
			assert.equal(await response.text(), JSON.stringify({ status: 'healthy' }));
		});

		it('should modify response after next() call', async () => {
			const locales = ['en'];
			const hasLocale = requestHasLocale(locales);
			const context = createManualRoutingContext({ pathname: '/en/api' });
			const next = createMockNext(new Response('Data'));

			let response;
			if (hasLocale(context)) {
				const originalResponse = await next();
				// Add custom header to response from next()
				response = new Response(originalResponse.body, {
					status: originalResponse.status,
					headers: {
						...Object.fromEntries(originalResponse.headers),
						'X-Custom-Header': 'added-by-middleware',
					},
				});
			}

			assert.ok(next.called);
			assert.equal(response.headers.get('X-Custom-Header'), 'added-by-middleware');
		});
	});
});
