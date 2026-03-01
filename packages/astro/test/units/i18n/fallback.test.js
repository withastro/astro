import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeFallbackRoute } from '../../../dist/i18n/fallback.js';
import { makeFallbackOptions } from './test-helpers.js';

describe('computeFallbackRoute', () => {
	describe('when response status < 300', () => {
		it('returns none (no fallback needed)', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/missing',
					responseStatus: 200,
					currentLocale: 'es',
					fallback: { es: 'en' },
				}),
			);

			assert.equal(result.type, 'none');
		});

		it('returns none for 299 status', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/missing',
					responseStatus: 299,
					currentLocale: 'es',
					fallback: { es: 'en' },
				}),
			);

			assert.equal(result.type, 'none');
		});
	});

	describe('when no fallback configured', () => {
		it('returns none for empty fallback object', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/missing',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: {},
				}),
			);

			assert.equal(result.type, 'none');
		});
	});

	describe('when locale not in fallback config', () => {
		it('returns none if current locale has no fallback', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/pt/missing',
					responseStatus: 404,
					currentLocale: 'pt',
					fallback: { es: 'en' }, // Only es has fallback
				}),
			);

			assert.equal(result.type, 'none');
		});
	});

	describe('with fallbackType: redirect', () => {
		it('returns redirect decision for fallback locale', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/missing',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
					strategy: 'pathname-prefix-always',
				}),
			);

			assert.equal(result.type, 'redirect');
			assert.equal(result.pathname, '/en/missing');
		});

		it('removes default locale prefix for prefix-other-locales strategy', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/missing',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
					strategy: 'pathname-prefix-other-locales',
					defaultLocale: 'en',
				}),
			);

			assert.equal(result.type, 'redirect');
			assert.equal(result.pathname, '/missing'); // No /en/ prefix
		});

		it('handles base path correctly', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/new-site/es/missing',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
					strategy: 'pathname-prefix-always',
					base: '/new-site',
				}),
			);

			assert.equal(result.type, 'redirect');
			assert.equal(result.pathname, '/new-site/en/missing');
		});

		it('handles base path with prefix-other-locales strategy', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/new-site/es/missing',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
					strategy: 'pathname-prefix-other-locales',
					defaultLocale: 'en',
					base: '/new-site',
				}),
			);

			assert.equal(result.type, 'redirect');
			assert.equal(result.pathname, '/new-site/missing');
		});

		it('handles fallback to non-default locale', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/pt/missing',
					responseStatus: 404,
					currentLocale: 'pt',
					fallback: { pt: 'es' }, // Fallback to Spanish, not English
					fallbackType: 'redirect',
					strategy: 'pathname-prefix-other-locales',
					defaultLocale: 'en',
				}),
			);

			assert.equal(result.type, 'redirect');
			assert.equal(result.pathname, '/es/missing');
		});

		it('handles 3xx redirect status', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/redirect',
					responseStatus: 301,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
				}),
			);

			assert.equal(result.type, 'redirect');
		});

		it('handles 4xx status', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/notfound',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
				}),
			);

			assert.equal(result.type, 'redirect');
		});

		it('handles 5xx status', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/error',
					responseStatus: 500,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
				}),
			);

			assert.equal(result.type, 'redirect');
		});
	});

	describe('with fallbackType: rewrite', () => {
		it('returns rewrite decision for fallback locale', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/missing',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'rewrite',
					strategy: 'pathname-prefix-always',
				}),
			);

			assert.equal(result.type, 'rewrite');
			assert.equal(result.pathname, '/en/missing');
		});

		it('removes default locale prefix for prefix-other-locales strategy', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/missing',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'rewrite',
					strategy: 'pathname-prefix-other-locales',
					defaultLocale: 'en',
				}),
			);

			assert.equal(result.type, 'rewrite');
			assert.equal(result.pathname, '/missing');
		});

		it('handles base path correctly', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/new-site/es/missing',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'rewrite',
					strategy: 'pathname-prefix-always',
					base: '/new-site',
				}),
			);

			assert.equal(result.type, 'rewrite');
			assert.equal(result.pathname, '/new-site/en/missing');
		});

		it('works with dynamic routes', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/blog/my-post',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'rewrite',
					strategy: 'pathname-prefix-always',
				}),
			);

			assert.equal(result.type, 'rewrite');
			assert.equal(result.pathname, '/en/blog/my-post');
		});

		it('handles deep nested paths', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/blog/2024/01/post',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'rewrite',
					strategy: 'pathname-prefix-always',
				}),
			);

			assert.equal(result.type, 'rewrite');
			assert.equal(result.pathname, '/en/blog/2024/01/post');
		});
	});

	describe('locale extraction from pathname', () => {
		it('finds locale in first segment', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/page',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
				}),
			);

			assert.equal(result.type, 'redirect');
		});

		it('handles paths without locale gracefully', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/page',
					responseStatus: 404,
					currentLocale: undefined,
					fallback: { es: 'en' },
					fallbackType: 'redirect',
				}),
			);

			assert.equal(result.type, 'none');
		});

		it('handles granular locale configurations (object format)', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/spanish/page',
					responseStatus: 404,
					currentLocale: 'es',
					locales: ['en', { path: 'spanish', codes: ['es', 'es-ES'] }, 'pt'],
					fallback: { spanish: 'en' },
					fallbackType: 'redirect',
					strategy: 'pathname-prefix-always',
				}),
			);

			assert.equal(result.type, 'redirect');
			assert.equal(result.pathname, '/en/page');
		});
	});

	describe('edge cases', () => {
		it('handles root path', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
					strategy: 'pathname-prefix-always',
				}),
			);

			assert.equal(result.type, 'redirect');
			assert.equal(result.pathname, '/en/');
		});

		it('handles pathname without trailing slash', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'redirect',
					strategy: 'pathname-prefix-always',
				}),
			);

			assert.equal(result.type, 'redirect');
			assert.equal(result.pathname, '/en');
		});

		it('preserves trailing content after locale replacement', () => {
			const result = computeFallbackRoute(
				makeFallbackOptions({
					pathname: '/es/a/b/c/d',
					responseStatus: 404,
					currentLocale: 'es',
					fallback: { es: 'en' },
					fallbackType: 'rewrite',
					strategy: 'pathname-prefix-always',
				}),
			);

			assert.equal(result.type, 'rewrite');
			assert.equal(result.pathname, '/en/a/b/c/d');
		});
	});
});
