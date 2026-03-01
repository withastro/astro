import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { I18nRouter } from '../../../dist/i18n/router.js';
import { makeI18nRouterConfig, makeRouterContext } from './test-helpers.js';

describe('I18nRouter', () => {
	describe('strategy: pathname-prefix-always', () => {
		let router;

		before(() => {
			const config = makeI18nRouterConfig({
				strategy: 'pathname-prefix-always',
				defaultLocale: 'en',
				locales: ['en', 'es', 'pt'],
			});
			router = new I18nRouter(config);
		});

		it('redirects root path to default locale', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/', context);

			assert.equal(result.type, 'redirect');
			assert.equal(result.location, '/en');
		});

		it('returns 404 for paths without locale prefix', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/about', context);

			assert.equal(result.type, 'notFound');
		});

		it('continues for paths with valid locale prefix', () => {
			const context = makeRouterContext({ currentLocale: 'es' });

			const result = router.match('/es/about', context);

			assert.equal(result.type, 'continue');
		});

		it('continues for default locale with prefix', () => {
			const context = makeRouterContext({ currentLocale: 'en' });

			const result = router.match('/en/about', context);

			assert.equal(result.type, 'continue');
		});

		describe('with base path', () => {
			let routerWithBase;

			before(() => {
				const configWithBase = makeI18nRouterConfig({
					strategy: 'pathname-prefix-always',
					defaultLocale: 'en',
					locales: ['en', 'es'],
					base: '/new-site',
				});
				routerWithBase = new I18nRouter(configWithBase);
			});

			it('handles base path - redirects base root to base + default locale', () => {
				const context = makeRouterContext({ currentLocale: undefined });

				const result = routerWithBase.match('/new-site/', context);

				assert.equal(result.type, 'redirect');
				assert.equal(result.location, '/new-site/en');
			});

			it('handles base path without trailing slash', () => {
				const context = makeRouterContext({ currentLocale: undefined });

				const result = routerWithBase.match('/new-site', context);

				assert.equal(result.type, 'redirect');
				assert.equal(result.location, '/new-site/en');
			});

			it('returns 404 for path without locale under base', () => {
				const context = makeRouterContext({ currentLocale: undefined });

				const result = routerWithBase.match('/new-site/about', context);

				assert.equal(result.type, 'notFound');
			});
		});
	});

	describe('strategy: pathname-prefix-other-locales', () => {
		let router;

		before(() => {
			const config = makeI18nRouterConfig({
				strategy: 'pathname-prefix-other-locales',
				defaultLocale: 'en',
				locales: ['en', 'es', 'pt'],
			});
			router = new I18nRouter(config);
		});

		it('returns 404 with Location header for default locale with prefix', () => {
			const context = makeRouterContext({ currentLocale: 'en' });

			const result = router.match('/en/about', context);

			assert.equal(result.type, 'notFound');
			assert.equal(result.location, '/about');
		});

		it('continues for non-default locale with prefix', () => {
			const context = makeRouterContext({ currentLocale: 'es' });

			const result = router.match('/es/about', context);

			assert.equal(result.type, 'continue');
		});

		it('continues for default locale without prefix', () => {
			const context = makeRouterContext({ currentLocale: 'en' });

			const result = router.match('/about', context);

			assert.equal(result.type, 'continue');
		});

		it('continues for root path (default locale)', () => {
			const context = makeRouterContext({ currentLocale: 'en' });

			const result = router.match('/', context);

			assert.equal(result.type, 'continue');
		});

		it('handles default locale in middle of path', () => {
			const context = makeRouterContext({ currentLocale: 'en' });

			const result = router.match('/blog/en/post', context);

			assert.equal(result.type, 'notFound');
			assert.equal(result.location, '/blog/post');
		});

		it('handles base path with default locale prefix', () => {
			const configWithBase = makeI18nRouterConfig({
				strategy: 'pathname-prefix-other-locales',
				defaultLocale: 'en',
				locales: ['en', 'es'],
				base: '/new-site',
			});
			const routerWithBase = new I18nRouter(configWithBase);
			const context = makeRouterContext({ currentLocale: 'en' });

			const result = routerWithBase.match('/new-site/en/about', context);

			assert.equal(result.type, 'notFound');
			assert.equal(result.location, '/new-site/about');
		});
	});

	describe('strategy: pathname-prefix-always-no-redirect', () => {
		let router;

		before(() => {
			const config = makeI18nRouterConfig({
				strategy: 'pathname-prefix-always-no-redirect',
				defaultLocale: 'en',
				locales: ['en', 'es', 'pt'],
			});
			router = new I18nRouter(config);
		});

		it('continues for root path (allows serving, no redirect)', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/', context);

			assert.equal(result.type, 'continue');
		});

		it('returns 404 for non-root paths without locale prefix', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/about', context);

			assert.equal(result.type, 'notFound');
		});

		it('continues for paths with valid locale prefix', () => {
			const context = makeRouterContext({ currentLocale: 'es' });

			const result = router.match('/es/about', context);

			assert.equal(result.type, 'continue');
		});

		it('continues for base root path', () => {
			const configWithBase = makeI18nRouterConfig({
				strategy: 'pathname-prefix-always-no-redirect',
				defaultLocale: 'en',
				locales: ['en', 'es'],
				base: '/new-site',
			});
			const routerWithBase = new I18nRouter(configWithBase);
			const context = makeRouterContext({ currentLocale: undefined });

			const result = routerWithBase.match('/new-site', context);

			assert.equal(result.type, 'continue');
		});
	});

	describe('strategy: domains-prefix-always', () => {
		let router;

		before(() => {
			const config = makeI18nRouterConfig({
				strategy: 'domains-prefix-always',
				defaultLocale: 'en',
				locales: ['en', 'es', 'fr'],
				domains: {
					'en.example.com': ['en'],
					'es.example.com': ['es'],
					'fr.example.com': ['fr'],
				},
			});
			router = new I18nRouter(config);
		});

		it('redirects root when locale matches domain', () => {
			const context = makeRouterContext({
				currentLocale: 'en',
				currentDomain: 'en.example.com',
			});

			const result = router.match('/', context);

			assert.equal(result.type, 'redirect');
			assert.equal(result.location, '/en');
		});

		it('continues when locale does not match domain (fallback to pathname logic)', () => {
			const context = makeRouterContext({
				currentLocale: 'es',
				currentDomain: 'en.example.com',
			});

			const result = router.match('/es/about', context);

			assert.equal(result.type, 'continue');
		});

		it('returns 404 for path without locale when locale matches domain', () => {
			const context = makeRouterContext({
				currentLocale: undefined,
				currentDomain: 'en.example.com',
			});

			const result = router.match('/about', context);

			assert.equal(result.type, 'notFound');
		});
	});

	describe('strategy: domains-prefix-other-locales', () => {
		let router;

		before(() => {
			const config = makeI18nRouterConfig({
				strategy: 'domains-prefix-other-locales',
				defaultLocale: 'en',
				locales: ['en', 'es', 'fr'],
				domains: {
					'en.example.com': ['en'],
					'es.example.com': ['es'],
					'fr.example.com': ['fr'],
				},
			});
			router = new I18nRouter(config);
		});

		it('returns 404 with Location for default locale prefix when locale matches domain', () => {
			const context = makeRouterContext({
				currentLocale: 'en',
				currentDomain: 'en.example.com',
			});

			const result = router.match('/en/about', context);

			assert.equal(result.type, 'notFound');
			assert.equal(result.location, '/about');
		});

		it('continues for non-default locale when locale matches domain', () => {
			const context = makeRouterContext({
				currentLocale: 'es',
				currentDomain: 'es.example.com',
			});

			const result = router.match('/es/about', context);

			assert.equal(result.type, 'continue');
		});

		it('continues when locale does not match domain', () => {
			const context = makeRouterContext({
				currentLocale: 'es',
				currentDomain: 'en.example.com',
			});

			const result = router.match('/es/about', context);

			assert.equal(result.type, 'continue');
		});
	});

	describe('strategy: domains-prefix-always-no-redirect', () => {
		let router;

		before(() => {
			const config = makeI18nRouterConfig({
				strategy: 'domains-prefix-always-no-redirect',
				defaultLocale: 'en',
				locales: ['en', 'es', 'fr'],
				domains: {
					'en.example.com': ['en'],
					'es.example.com': ['es'],
					'fr.example.com': ['fr'],
				},
			});
			router = new I18nRouter(config);
		});

		it('continues for root when locale matches domain (allows serving, no redirect)', () => {
			const context = makeRouterContext({
				currentLocale: undefined,
				currentDomain: 'en.example.com',
			});

			const result = router.match('/', context);

			assert.equal(result.type, 'continue');
		});

		it('continues for path with locale when locale matches domain', () => {
			const context = makeRouterContext({
				currentLocale: 'en',
				currentDomain: 'en.example.com',
			});

			const result = router.match('/en/about', context);

			assert.equal(result.type, 'continue');
		});
	});

	describe('route filtering - skips i18n processing', () => {
		let router;

		before(() => {
			const config = makeI18nRouterConfig({
				strategy: 'pathname-prefix-always',
				defaultLocale: 'en',
				locales: ['en', 'es'],
			});
			router = new I18nRouter(config);
		});

		it('skips 404 pages', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/404', context);

			assert.equal(result.type, 'continue');
		});

		it('skips 500 pages', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/500', context);

			assert.equal(result.type, 'continue');
		});

		it('skips server islands', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/_server-islands/Counter', context);

			assert.equal(result.type, 'continue');
		});

		it('skips non-page routes (endpoint)', () => {
			const context = makeRouterContext({
				currentLocale: undefined,
				routeType: 'endpoint',
			});

			const result = router.match('/api/data', context);

			assert.equal(result.type, 'continue');
		});

		it('skips reroutes', () => {
			const context = makeRouterContext({
				currentLocale: undefined,
				isReroute: true,
			});

			const result = router.match('/about', context);

			assert.equal(result.type, 'continue');
		});

		it('processes fallback routes', () => {
			const context = makeRouterContext({
				currentLocale: undefined,
				routeType: 'fallback',
			});

			const result = router.match('/about', context);

			assert.equal(result.type, 'notFound');
		});
	});

	describe('strategy: manual', () => {
		let router;

		before(() => {
			const config = makeI18nRouterConfig({
				strategy: 'manual',
				defaultLocale: 'en',
				locales: ['en', 'es'],
			});
			router = new I18nRouter(config);
		});

		it('always continues (no automatic routing)', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/', context);

			assert.equal(result.type, 'continue');
		});

		it('continues for any path', () => {
			const context = makeRouterContext({ currentLocale: undefined });

			const result = router.match('/any/path', context);

			assert.equal(result.type, 'continue');
		});
	});
});
