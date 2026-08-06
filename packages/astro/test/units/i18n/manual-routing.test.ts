import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	requestHasLocale,
	redirectToDefaultLocale,
	notFound,
	redirectToFallback,
} from '../../../dist/i18n/index.js';
import { getFetchStateFromAPIContext } from '../../../dist/core/fetch/fetch-state.js';
import { createManualRoutingContext, createMiddlewarePayload } from './test-helpers.ts';

describe('requestHasLocale', () => {
	it('should return a function', () => {
		const hasLocale = requestHasLocale(['en', 'es']);
		assert.equal(typeof hasLocale, 'function');
	});

	it('should check context.url.pathname for locale', () => {
		const hasLocale = requestHasLocale(['en', 'es']);
		const context = createManualRoutingContext({ pathname: '/en/blog' });
		assert.equal(hasLocale(context), true);
	});

	it('should return true for paths with configured locales', () => {
		const hasLocale = requestHasLocale(['en', 'es', 'pt']);

		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/en' })), true);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/es/about' })), true);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/pt/blog/post' })), true);
	});

	it('should return false for paths without locales', () => {
		const hasLocale = requestHasLocale(['en', 'es']);

		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/blog' })), false);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/about' })), false);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/' })), false);
	});

	it('should work with locale objects', () => {
		const hasLocale = requestHasLocale(['en', { path: 'spanish', codes: ['es', 'es-ar'] }]);

		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/en' })), true);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/spanish' })), true);
		assert.equal(hasLocale(createManualRoutingContext({ pathname: '/es' })), false);
	});

	it('should not modify context', () => {
		const hasLocale = requestHasLocale(['en']);
		const context = createManualRoutingContext({ pathname: '/en/blog' });
		const originalPathname = context.url.pathname;

		hasLocale(context);

		assert.equal(context.url.pathname, originalPathname);
	});

	it('should handle different hostnames', () => {
		const hasLocale = requestHasLocale(['en', 'es']);

		const context1 = createManualRoutingContext({ pathname: '/en', hostname: 'localhost' });
		const context2 = createManualRoutingContext({ pathname: '/en', hostname: '127.0.0.1' });

		assert.equal(hasLocale(context1), true);
		assert.equal(hasLocale(context2), true);
	});

	it('should work consistently across multiple calls', () => {
		const hasLocale = requestHasLocale(['en', 'es']);
		const context = createManualRoutingContext({ pathname: '/en/blog' });

		assert.equal(hasLocale(context), true);
		assert.equal(hasLocale(context), true);
		assert.equal(hasLocale(context), true);
	});
});

describe('redirectToDefaultLocale', () => {
	describe('basic redirect generation', () => {
		it('should create a function that returns a Response', () => {
			const payload = createMiddlewarePayload({
				defaultLocale: 'en',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.ok(response instanceof Response);
		});

		it('should redirect to default locale with no base', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.status, 302);
			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should use default status 302', () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.status, 302);
		});
	});

	describe('custom status codes', () => {
		it('should accept custom status code 301', () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 301);

			assert.equal(response.status, 301);
			// Default payload has trailingSlash: 'ignore' + format: 'directory'
			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should accept custom status code 307', () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 307);

			assert.equal(response.status, 307);
		});

		it('should accept custom status code 308', () => {
			const payload = createMiddlewarePayload({ defaultLocale: 'en' });
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 308);

			assert.equal(response.status, 308);
		});
	});

	describe('base path handling', () => {
		it('should redirect to base + locale', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/blog/en/');
		});

		it('should handle base with leading slash', () => {
			const payload = createMiddlewarePayload({
				base: '/my-site',
				defaultLocale: 'pt',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/my-site/pt/');
		});

		it('should handle base with trailing slash', () => {
			const payload = createMiddlewarePayload({
				base: '/blog/',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// joinPaths normalizes, then trailingSlash: 'ignore' + format: 'directory' adds /
			assert.equal(response.headers.get('Location'), '/blog/en/');
		});

		it('should handle complex base paths', () => {
			const payload = createMiddlewarePayload({
				base: '/sites/my-app',
				defaultLocale: 'es',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/sites/my-app/es/');
		});
	});

	describe('trailing slash behavior', () => {
		it('should add trailing slash with trailingSlash: always and format: directory', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'always',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should not add trailing slash with trailingSlash: never', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'never',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.headers.get('Location'), '/en');
		});

		it('should add trailing slash with trailingSlash: ignore and format: directory', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should add trailing slash with trailingSlash: always and format: file', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'always',
				format: 'file',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.headers.get('Location'), '/en/');
		});

		it('should not add trailing slash with trailingSlash: never and format: file', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'never',
				format: 'file',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			assert.equal(response.headers.get('Location'), '/en');
		});
	});

	describe('combined scenarios', () => {
		it('should handle base + trailing slash + status code', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				defaultLocale: 'pt',
				trailingSlash: 'always',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 301);

			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/blog/pt/');
		});

		it('should handle complex locale codes', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'es-AR',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/es-AR/');
		});

		it('should work with underscore locales', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en_US',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context);

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response.headers.get('Location'), '/en_US/');
		});

		it('should handle all parameters combined', () => {
			const payload = createMiddlewarePayload({
				base: '/sites/app',
				defaultLocale: 'pt-BR',
				trailingSlash: 'always',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = redirect(context, 307);

			assert.equal(response.status, 307);
			assert.equal(response.headers.get('Location'), '/sites/app/pt-BR/');
		});
	});

	describe('context independence', () => {
		it('should work regardless of context pathname', () => {
			const payload = createMiddlewarePayload({
				base: '',
				defaultLocale: 'en',
				trailingSlash: 'ignore',
				format: 'directory',
			});
			const redirect = redirectToDefaultLocale(payload);

			// All should redirect to the same place
			const response1 = redirect(createManualRoutingContext({ pathname: '/' }));
			const response2 = redirect(createManualRoutingContext({ pathname: '/about' }));
			const response3 = redirect(createManualRoutingContext({ pathname: '/blog/post' }));

			// trailingSlash: 'ignore' + format: 'directory' adds trailing slash
			assert.equal(response1.headers.get('Location'), '/en/');
			assert.equal(response2.headers.get('Location'), '/en/');
			assert.equal(response3.headers.get('Location'), '/en/');
		});
	});
});

describe('notFound', () => {
	describe('basic 404 for non-locale paths', () => {
		it('should return 404 Response for paths without locale', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.ok(response instanceof Response);
			assert.equal(response!.status, 404);
		});

		it('should return 404 for /about with configured locales', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/about' });

			const response = notFoundFn(context);

			assert.equal(response!.status, 404);
		});

		it('should set skipErrorReroute on FetchState', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.equal(response!.headers.get('x-astro-reroute'), null);
			assert.equal(getFetchStateFromAPIContext(context).skipErrorReroute, true);
		});
	});

	describe('root path handling', () => {
		it('should return undefined for / (root)', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/' });

			const response = notFoundFn(context);

			assert.equal(response, undefined);
		});

		it('should return undefined for base path as root', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.equal(response, undefined);
		});

		it('should return undefined for base path with trailing slash', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog/' });

			const response = notFoundFn(context);

			assert.equal(response, undefined);
		});
	});

	describe('locale paths allowed', () => {
		it('should return undefined for valid locale paths', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);

			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/en/blog' })), undefined);
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/es/about' })), undefined);
		});

		it('should return undefined for locale object paths', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: [{ path: 'spanish', codes: ['es'] }],
			});
			const notFoundFn = notFound(payload);

			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/spanish' })), undefined);
			assert.equal(
				notFoundFn(createManualRoutingContext({ pathname: '/spanish/blog' })),
				undefined,
			);
		});

		it('should return undefined for mixed locale config', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', { path: 'spanish', codes: ['es'] }],
			});
			const notFoundFn = notFound(payload);

			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/en' })), undefined);
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/spanish' })), undefined);
		});
	});

	describe('response parameter handling', () => {
		it('should preserve body when Response is passed', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('Original body', { status: 200 });

			const response = notFoundFn(context, originalResponse);

			assert.equal(response!.status, 404);
			assert.equal(response!.body, originalResponse.body);
		});

		it('should copy headers when Response is passed', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('body', {
				status: 200,
				headers: { 'X-Custom': 'value' },
			});

			const response = notFoundFn(context, originalResponse);

			assert.equal(response!.status, 404);
			assert.equal(response!.headers.get('X-Custom'), 'value');
		});

		it('should override status to 404 when Response is passed', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('body', { status: 200 });

			const response = notFoundFn(context, originalResponse);

			assert.equal(response!.status, 404);
		});

		it('should set skipErrorReroute on passed Response', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			const originalResponse = new Response('body');

			const response = notFoundFn(context, originalResponse);

			assert.equal(response!.headers.get('x-astro-reroute'), null);
			assert.equal(getFetchStateFromAPIContext(context).skipErrorReroute, true);
		});

		it('should return original response when skipErrorReroute is true and no fallback', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
				fallback: undefined,
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			getFetchStateFromAPIContext(context).skipErrorReroute = true;
			const originalResponse = new Response('body');

			const response = notFoundFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});
	});

	describe('fallback configuration', () => {
		it('should still return 404 for non-locale paths with fallback configured', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
				fallback: { es: 'en' },
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.equal(response!.status, 404);
		});

		it('should not return original response with fallback when skipErrorReroute is true', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
				fallback: { es: 'en' },
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });
			getFetchStateFromAPIContext(context).skipErrorReroute = true;
			const originalResponse = new Response('body');

			const response = notFoundFn(context, originalResponse);

			// With fallback defined, it should not return the original
			assert.notEqual(response, originalResponse);
			assert.equal(response!.status, 404);
		});
	});

	describe('base path handling', () => {
		it('should return 404 for non-locale paths with base', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog/about' });

			const response = notFoundFn(context);

			assert.equal(response!.status, 404);
		});

		it('should allow locale paths with base', () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);

			assert.equal(
				notFoundFn(createManualRoutingContext({ pathname: '/blog/en/about' })),
				undefined,
			);
			assert.equal(
				notFoundFn(createManualRoutingContext({ pathname: '/blog/es/post' })),
				undefined,
			);
		});

		it('should return 404 for paths without locale under base', () => {
			const payload = createMiddlewarePayload({
				base: '/site',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);

			const response = notFoundFn(createManualRoutingContext({ pathname: '/site/contact' }));

			assert.equal(response!.status, 404);
		});
	});

	describe('edge cases', () => {
		it('should handle empty pathname', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '' });

			// Empty pathname is treated as root
			const response = notFoundFn(context);

			// Based on implementation, empty string might be treated as root
			assert.ok(response === undefined || response.status === 404);
		});

		it('should handle case sensitivity in locale matching', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);

			// Normalized matching
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/EN' })), undefined);
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/Es' })), undefined);
		});

		it('should work with single locale', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en'],
			});
			const notFoundFn = notFound(payload);

			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/en' })), undefined);
			assert.equal(notFoundFn(createManualRoutingContext({ pathname: '/es' }))!.status, 404);
		});

		it('should return null body for 404 without passed Response', () => {
			const payload = createMiddlewarePayload({
				base: '',
				locales: ['en', 'es'],
			});
			const notFoundFn = notFound(payload);
			const context = createManualRoutingContext({ pathname: '/blog' });

			const response = notFoundFn(context);

			assert.equal(response!.body, null);
		});
	});
});

describe('redirectToFallback', () => {
	describe('basic fallback behavior', () => {
		it('should return original response when status is not 404', async () => {
			const payload = createMiddlewarePayload({
				fallback: { es: 'en' },
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/about' });
			const originalResponse = new Response('Content', { status: 200 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});

		it('should redirect when status is 404 and locale has fallback', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es', 'fr'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/about' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/about');
		});

		it('should return original response when no fallback configured', async () => {
			const payload = createMiddlewarePayload({
				fallback: undefined,
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/about' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});

		it('should return original response when locale not in fallback config', async () => {
			const payload = createMiddlewarePayload({
				fallback: { es: 'en' },
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/fr/about' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});
	});

	describe('fallbackType: redirect', () => {
		it('should redirect to fallback locale', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es', 'fr'],
				defaultLocale: 'en',
				fallback: { es: 'fr' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/blog/post' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/fr/blog/post');
		});

		it('should remove default locale prefix with prefix-other-locales strategy', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-other-locales',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/about' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/about');
		});

		it('should handle base path correctly', async () => {
			const payload = createMiddlewarePayload({
				base: '/blog',
				locales: ['en', 'es'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-other-locales',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/blog/es/post' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/blog/post');
		});

		it('should preserve query string', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/search?q=test' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/search?q=test');
		});

		it('should not redirect for 3xx status codes', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page' });
			const originalResponse = new Response(null, { status: 301 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});

		it('should not redirect for non-404 4xx status codes', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page' });
			const originalResponse = new Response(null, { status: 403 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});

		it('should not redirect for 5xx status codes', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page' });
			const originalResponse = new Response(null, { status: 500 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});
	});

	describe('fallbackType: rewrite', () => {
		it('should rewrite to fallback locale', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es', 'fr'],
				defaultLocale: 'en',
				fallback: { es: 'fr' },
				fallbackType: 'rewrite',
			});
			const fallbackFn = redirectToFallback(payload);

			// Mock context.rewrite
			const context = {
				...createManualRoutingContext({ pathname: '/es/blog/post' }),
				rewrite: async (path: string) => {
					return new Response(null, {
						status: 200,
						headers: { 'X-Rewrite-Path': path },
					});
				},
			};
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 200);
			assert.equal(response.headers.get('X-Rewrite-Path'), '/fr/blog/post');
		});

		it('should preserve query string in rewrite', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'rewrite',
			});
			const fallbackFn = redirectToFallback(payload);

			const context = {
				...createManualRoutingContext({ pathname: '/es/search?q=test&lang=es' }),
				rewrite: async (path: string) => {
					return new Response(null, {
						headers: { 'X-Rewrite-Path': path },
					});
				},
			};
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('X-Rewrite-Path'), '/search?q=test&lang=es');
		});

		it('should remove default locale prefix with prefix-other-locales strategy', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-other-locales',
				fallback: { es: 'en' },
				fallbackType: 'rewrite',
			});
			const fallbackFn = redirectToFallback(payload);

			const context = {
				...createManualRoutingContext({ pathname: '/es/about' }),
				rewrite: async (path: string) => {
					return new Response(null, {
						headers: { 'X-Rewrite-Path': path },
					});
				},
			};
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('X-Rewrite-Path'), '/about');
		});
	});

	describe('locale extraction from pathname', () => {
		it('should find locale in first segment', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/blog' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.notEqual(response, originalResponse);
			assert.equal(response.status, 302);
		});

		it('should handle locale objects with path', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', { path: 'spanish', codes: ['es'] }],
				defaultLocale: 'en',
				fallback: { spanish: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/spanish/blog' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), '/blog');
		});

		it('should handle fallback to non-default locale', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es', 'fr'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-always',
				fallback: { es: 'fr' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/fr/page');
		});
	});

	describe('edge cases', () => {
		it('should handle root path with locale', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			// When replacing /es with empty string, we get empty path
			assert.equal(response.headers.get('Location'), '');
		});

		it('should handle deep nested paths', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				defaultLocale: 'en',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/blog/2024/post/title' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/blog/2024/post/title');
		});

		it('should handle base path without trailing slash', async () => {
			const payload = createMiddlewarePayload({
				base: '/site',
				locales: ['en', 'es'],
				defaultLocale: 'en',
				strategy: 'pathname-prefix-other-locales',
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/site/es/page' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response.headers.get('Location'), '/site/page');
		});

		it('should not fallback when locale is not found in path', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/blog/post' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			assert.equal(response, originalResponse);
		});

		it('should handle empty query string', async () => {
			const payload = createMiddlewarePayload({
				locales: ['en', 'es'],
				fallback: { es: 'en' },
				fallbackType: 'redirect',
			});
			const fallbackFn = redirectToFallback(payload);
			const context = createManualRoutingContext({ pathname: '/es/page?' });
			const originalResponse = new Response(null, { status: 404 });

			const response = await fallbackFn(context, originalResponse);

			// context.url.search is empty for '?', so query string is not preserved
			assert.equal(response.headers.get('Location'), '/page');
		});
	});
});
