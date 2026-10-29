import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matchAllRoutes, matchRoute } from '../../../dist/core/routing/match.js';
import { makeRoute, staticPart } from './test-helpers.ts';

describe('matchAllRoutes fallbackRoutes', () => {
	it('includes routes that match only via fallbackRoutes (i18n)', () => {
		const trailingSlash = 'never';
		const fallbackRoute = makeRoute({
			segments: [[staticPart('es'), staticPart('start')]],
			trailingSlash,
			route: '/es/start',
			pathname: '/es/start',
		});
		const mainRoute = makeRoute({
			segments: [[staticPart('start')]],
			trailingSlash,
			route: '/start',
			pathname: '/start',
		});
		mainRoute.fallbackRoutes = [fallbackRoute];

		const manifest = { routes: [mainRoute] } as any;

		assert.equal(matchRoute('/es/start', manifest), mainRoute);
		assert.deepEqual(matchAllRoutes('/es/start', manifest), [mainRoute]);
		assert.deepEqual(matchAllRoutes('/start', manifest), [mainRoute]);
		assert.deepEqual(matchAllRoutes('/missing', manifest), []);
	});
});
