// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18nFallbackRoutes } from '../../../dist/core/routing/create-manifest.js';
import { createRouteData } from '../mocks.js';

const BASE_CONFIG = {
	base: '/',
	trailingSlash: 'ignore',
};

function makeI18n(overrides = {}) {
	return {
		defaultLocale: 'en',
		locales: ['en', 'es'],
		routing: {},
		domains: {},
		...overrides,
	};
}

describe('createI18nFallbackRoutes — prefix-other-locales, es → en fallback', () => {
	it('creates a fallback route for /start when /es/start does not exist', () => {
		const enStart = createRouteData({ route: '/start', pathname: '/start', type: 'page' });
		const routes = [enStart];

		createI18nFallbackRoutes(routes, makeI18n({ fallback: { es: 'en' } }), BASE_CONFIG);

		const fallback = enStart.fallbackRoutes.find((r) => r.route === '/es/start');
		assert.ok(fallback, 'expected fallback route /es/start');
		assert.equal(fallback.type, 'fallback');
		assert.equal(fallback.pathname, '/es/start');
	});

	it('does not create a fallback when /es/start already exists', () => {
		const enStart = createRouteData({ route: '/start', pathname: '/start', type: 'page' });
		const esStart = createRouteData({ route: '/es/start', pathname: '/es/start', type: 'page' });
		const routes = [enStart, esStart];

		createI18nFallbackRoutes(routes, makeI18n({ fallback: { es: 'en' } }), BASE_CONFIG);

		assert.equal(enStart.fallbackRoutes.length, 0);
	});

	it('creates fallback routes for multiple EN pages without ES equivalents', () => {
		const enStart = createRouteData({ route: '/start', pathname: '/start', type: 'page' });
		const enAbout = createRouteData({ route: '/about', pathname: '/about', type: 'page' });
		const routes = [enStart, enAbout];

		createI18nFallbackRoutes(routes, makeI18n({ fallback: { es: 'en' } }), BASE_CONFIG);

		assert.ok(enStart.fallbackRoutes.find((r) => r.route === '/es/start'));
		assert.ok(enAbout.fallbackRoutes.find((r) => r.route === '/es/about'));
	});

	it('does not double-prefix: /es/start only once when real ES page exists for a different route', () => {
		const enStart = createRouteData({ route: '/start', pathname: '/start', type: 'page' });
		const esOther = createRouteData({ route: '/es/other', pathname: '/es/other', type: 'page' });
		const routes = [enStart, esOther];

		createI18nFallbackRoutes(routes, makeI18n({ fallback: { es: 'en' } }), BASE_CONFIG);

		const fallbacks = enStart.fallbackRoutes.filter((r) => r.route === '/es/start');
		assert.equal(fallbacks.length, 1, 'should not create duplicate fallback routes');

		// The /es/ prefix should not be applied twice: no /es/es/start
		const doublePrefixed = enStart.fallbackRoutes.find((r) => r.route.includes('/es/es/'));
		assert.equal(doublePrefixed, undefined, 'double-prefixed route /es/es/start should not exist');
	});
});

describe('createI18nFallbackRoutes — prefix-always, root redirect', () => {
	it('creates a / fallback route pointing to the default locale index', () => {
		const enIndex = createRouteData({ route: '/en', pathname: '/en', type: 'page' });
		const routes = [enIndex];

		createI18nFallbackRoutes(
			routes,
			makeI18n({
				defaultLocale: 'en',
				locales: ['en', 'pt'],
				routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
			}),
			BASE_CONFIG,
		);

		const rootFallback = routes.find((r) => r.route === '/' && r.type === 'fallback');
		assert.ok(rootFallback, 'expected a root / fallback route for prefix-always strategy');
	});
});

describe('createI18nFallbackRoutes — multiple fallback locales', () => {
	it('creates fallback routes for both it and spanish when fallback to en', () => {
		const enStart = createRouteData({ route: '/start', pathname: '/start', type: 'page' });
		const routes = [enStart];

		createI18nFallbackRoutes(
			routes,
			makeI18n({
				defaultLocale: 'en',
				locales: ['en', 'it', { path: 'spanish', codes: ['es', 'es-AR'] }],
				fallback: { it: 'en', spanish: 'en' },
			}),
			BASE_CONFIG,
		);

		const itFallback = enStart.fallbackRoutes.find((r) => r.route === '/it/start');
		const esFallback = enStart.fallbackRoutes.find((r) => r.route === '/spanish/start');
		assert.ok(itFallback, 'expected fallback for /it/start');
		assert.ok(esFallback, 'expected fallback for /spanish/start');
		assert.equal(itFallback.type, 'fallback');
		assert.equal(esFallback.type, 'fallback');
	});
});

describe('createI18nFallbackRoutes — no fallback config', () => {
	it('does not generate any fallback routes when fallback is not configured', () => {
		const enStart = createRouteData({ route: '/start', pathname: '/start', type: 'page' });
		const routes = [enStart];

		createI18nFallbackRoutes(routes, makeI18n(), BASE_CONFIG);

		assert.equal(enStart.fallbackRoutes.length, 0);
		assert.equal(routes.length, 1);
	});
});
