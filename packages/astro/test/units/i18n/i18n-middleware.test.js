// @ts-check
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { createI18nMiddleware } from '../../../dist/i18n/middleware.js';
import { createMockAPIContext } from '../middleware/test-helpers.js';

/**
 * Creates a "page" response that mimics what the render pipeline returns.
 * The `X-Astro-Route-Type: page` header is what the i18n middleware reads
 * to decide whether to apply routing logic.
 *
 * @param {string} body
 * @param {number} [status]
 * @param {Record<string, string>} [extraHeaders]
 */
function makePageResponse(body, status = 200, extraHeaders = {}) {
	return new Response(body, {
		status,
		headers: { 'X-Astro-Route-Type': 'page', ...extraHeaders },
	});
}

/**
 * Creates a minimal i18n manifest.
 * @param {Partial<{
 *   defaultLocale: string,
 *   locales: import('../../../src/types/public/config.js').Locales,
 *   strategy: import('../../../dist/core/app/common.js').RoutingStrategies,
 *   fallbackType: 'redirect' | 'rewrite',
 *   fallback: Record<string, string>,
 *   domainLookupTable: Record<string, string>,
 *   domains: Record<string, string>,
 * }>} [overrides]
 */
function makeI18nManifest(overrides = {}) {
	return {
		defaultLocale: overrides.defaultLocale ?? 'en',
		locales: overrides.locales ?? ['en', 'it'],
		strategy: overrides.strategy ?? 'pathname-prefix-always',
		fallbackType: overrides.fallbackType ?? 'rewrite',
		fallback: overrides.fallback ?? {},
		domains: overrides.domains ?? {},
		domainLookupTable: overrides.domainLookupTable ?? {},
	};
}

describe('createI18nMiddleware', () => {
	it('returns a passthrough handler when i18n config is undefined', async () => {
		const handler = createI18nMiddleware(undefined, '/', 'ignore', 'directory');
		const ctx = createMockAPIContext({ url: 'http://localhost/anything' });
		const pageResponse = makePageResponse('original');

		const result = await handler(ctx, async () => pageResponse);

		assert.equal(result, pageResponse, 'should return the exact same response object');
	});

	describe('pathname-prefix-always strategy', () => {
		/** @type {import('astro').MiddlewareHandler} */
		let handler;

		beforeEach(() => {
			handler = createI18nMiddleware(
				makeI18nManifest({ strategy: 'pathname-prefix-always' }),
				'/',
				'ignore',
				'directory',
			);
		});

		it('returns 404 for a non-locale-prefixed path', async () => {
			const ctx = createMockAPIContext({ url: 'http://localhost/blog' });
			const next = async () => makePageResponse('Blog should not render');

			const result = await handler(ctx, next);

			assert.equal(result.status, 404);
			assert.equal(await result.text(), 'Blog should not render');
		});

		it('passes through a locale-prefixed path', async () => {
			const ctx = createMockAPIContext({ url: 'http://localhost/en/start' });
			const next = async () => makePageResponse('en page');

			const result = await handler(ctx, next);

			assert.equal(result.status, 200);
			assert.equal(await result.text(), 'en page');
		});

		it('redirects root / to /{defaultLocale}/', async () => {
			const ctx = createMockAPIContext({ url: 'http://localhost/' });
			const next = async () => makePageResponse('root');

			const result = await handler(ctx, next);

			assert.equal(result.status, 302);
			assert.ok(
				result.headers.get('Location')?.includes('/en'),
				`expected Location to contain /en, got: ${result.headers.get('Location')}`,
			);
		});
	});

	describe('pathname-prefix-other-locales strategy', () => {
		/** @type {import('astro').MiddlewareHandler} */
		let handler;

		beforeEach(() => {
			handler = createI18nMiddleware(
				makeI18nManifest({ strategy: 'pathname-prefix-other-locales' }),
				'/',
				'ignore',
				'directory',
			);
		});

		it('passes through un-prefixed paths for the default locale', async () => {
			const ctx = createMockAPIContext({ url: 'http://localhost/blog' });
			const next = async () => makePageResponse('en blog');

			const result = await handler(ctx, next);

			assert.equal(result.status, 200);
		});

		it('returns 404 when default locale prefix is used', async () => {
			const ctx = createMockAPIContext({ url: 'http://localhost/en/blog' });
			const next = async () => makePageResponse('should not be visible');

			const result = await handler(ctx, next);

			assert.equal(result.status, 404);
		});
	});

	describe('fallback routing', () => {
		it('redirects to fallback locale path when fallbackType is redirect', async () => {
			const handler = createI18nMiddleware(
				makeI18nManifest({
					strategy: 'pathname-prefix-always',
					fallbackType: 'redirect',
					fallback: { it: 'en' },
				}),
				'/',
				'ignore',
				'directory',
			);
			const ctx = createMockAPIContext({ url: 'http://localhost/it/start' });
			const next = async () => makePageResponse('no it page', 404);

			const result = await handler(ctx, next);

			assert.equal(result.status, 302);
			assert.equal(result.headers.get('Location'), '/en/start');
		});

		it('rewrites to fallback locale path when fallbackType is rewrite', async () => {
			const handler = createI18nMiddleware(
				makeI18nManifest({
					strategy: 'pathname-prefix-always',
					fallbackType: 'rewrite',
					fallback: { it: 'en' },
				}),
				'/',
				'ignore',
				'directory',
			);
			const ctx = createMockAPIContext({
				url: 'http://localhost/it/start',
				rewrite: async (path) => new Response(`rewritten to ${path}`, { status: 200 }),
			});
			const next = async () => makePageResponse('no it page', 404);

			const result = await handler(ctx, next);

			assert.equal(result.status, 200);
			assert.equal(await result.text(), 'rewritten to /en/start');
		});
	});

	describe('early-return guards', () => {
		it('passes through when X-Astro-Reroute is no and no fallback is configured', async () => {
			const handler = createI18nMiddleware(
				makeI18nManifest({ fallback: undefined }),
				'/',
				'ignore',
				'directory',
			);
			const ctx = createMockAPIContext({ url: 'http://localhost/404' });
			const pageResponse = new Response('not found', {
				status: 404,
				headers: { 'X-Astro-Route-Type': 'page', 'X-Astro-Reroute': 'no' },
			});

			const result = await handler(ctx, async () => pageResponse);

			assert.equal(result, pageResponse, 'should return the exact same response');
		});

		it('passes through when route type is not page or fallback', async () => {
			const handler = createI18nMiddleware(makeI18nManifest(), '/', 'ignore', 'directory');
			const ctx = createMockAPIContext({ url: 'http://localhost/api/data' });
			const endpointResponse = new Response('{"ok":true}', {
				headers: { 'X-Astro-Route-Type': 'endpoint' },
			});

			const result = await handler(ctx, async () => endpointResponse);

			assert.equal(result, endpointResponse, 'should return the exact same response');
		});
	});
});
