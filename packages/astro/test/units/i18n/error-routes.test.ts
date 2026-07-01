import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getErrorRoutePath, isLocalizedErrorRoute } from '../../../dist/i18n/error-routes.js';

describe('getErrorRoutePath', () => {
	const routes = [{ route: '/404' }, { route: '/500' }, { route: '/pt/404' }, { route: '/it/500' }];
	const locales = ['en', 'pt', 'it'];

	it('prefers a matching localized 404 route', () => {
		assert.equal(getErrorRoutePath('/pt/missing', 404, routes, locales), '/pt/404');
	});

	it('prefers a matching localized 500 route', () => {
		assert.equal(getErrorRoutePath('/it/missing', 500, routes, locales), '/it/500');
	});

	it('falls back to the global error route when the localized route is not defined', () => {
		assert.equal(getErrorRoutePath('/it/missing', 404, routes, locales), '/404');
	});

	it('falls back to the global error route when the request has no locale prefix', () => {
		assert.equal(getErrorRoutePath('/missing', 404, routes, locales), '/404');
	});

	it('falls back to the global error route when no locales are configured', () => {
		assert.equal(getErrorRoutePath('/pt/missing', 404, routes, undefined), '/404');
	});

	it('supports locale path objects', () => {
		assert.equal(
			getErrorRoutePath(
				'/brasil/missing',
				404,
				[{ route: '/brasil/404' }],
				['en', { path: 'brasil', codes: ['pt-BR'] }],
			),
			'/brasil/404',
		);
	});

	it('can append a trailing slash', () => {
		assert.equal(getErrorRoutePath('/pt/missing', 404, routes, locales, true), '/pt/404/');
	});

	it('appends a trailing slash to the global fallback too', () => {
		assert.equal(getErrorRoutePath('/missing', 404, routes, locales, true), '/404/');
	});
});

describe('isLocalizedErrorRoute', () => {
	const locales = ['en', 'pt', 'it'];

	it('matches a locale-prefixed 404 route', () => {
		assert.equal(isLocalizedErrorRoute('/pt/404', 404, locales), true);
	});

	it('matches a locale-prefixed 500 route', () => {
		assert.equal(isLocalizedErrorRoute('/it/500', 500, locales), true);
	});

	it('does not match a non-locale prefix ending in the status', () => {
		assert.equal(isLocalizedErrorRoute('/docs/404', 404, locales), false);
	});

	it('does not match the root error route (no locale prefix)', () => {
		assert.equal(isLocalizedErrorRoute('/404', 404, locales), false);
	});

	it('does not match a multi-segment route ending in the status', () => {
		assert.equal(isLocalizedErrorRoute('/pt/docs/404', 404, locales), false);
	});

	it('does not match when the status differs', () => {
		assert.equal(isLocalizedErrorRoute('/pt/404', 500, locales), false);
	});

	it('does not match a route that merely contains the status as a substring', () => {
		assert.equal(isLocalizedErrorRoute('/pt/404-page', 404, locales), false);
		assert.equal(isLocalizedErrorRoute('/pt/x404', 404, locales), false);
	});

	it('returns false when no locales are configured', () => {
		assert.equal(isLocalizedErrorRoute('/pt/404', 404, undefined), false);
	});

	it('returns false for an empty locales array', () => {
		assert.equal(isLocalizedErrorRoute('/pt/404', 404, []), false);
	});

	it('matches case-insensitively per locale normalization', () => {
		assert.equal(isLocalizedErrorRoute('/PT/404', 404, locales), true);
	});

	it('supports locale path objects', () => {
		assert.equal(
			isLocalizedErrorRoute('/brasil/404', 404, ['en', { path: 'brasil', codes: ['pt-BR'] }]),
			true,
		);
	});
});
