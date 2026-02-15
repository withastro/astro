import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPattern } from '../../../dist/core/routing/manifest/pattern.js';
import { Router } from '../../../dist/core/routing/router.js';

const staticPart = (content) => ({ content, dynamic: false, spread: false });

const makeRoute = ({ segments, trailingSlash, route, pathname, origin = 'project' }) => {
	return {
		route,
		component: route,
		params: [],
		pathname,
		pattern: getPattern(segments, '/', trailingSlash),
		segments,
		type: 'page',
		prerender: false,
		fallbackRoutes: [],
		distURL: [],
		isIndex: false,
		origin,
	};
};

describe('virtual routes (unit)', () => {
	const trailingSlash = 'ignore';
	const routes = [
		makeRoute({
			segments: [[staticPart('virtual')]],
			trailingSlash,
			route: '/virtual',
			pathname: '/virtual',
			origin: 'external',
		}),
	];

	const router = new Router(routes, {
		base: '/',
		trailingSlash,
		buildFormat: 'directory',
	});

	it('matches injected virtual routes', () => {
		const match = router.match('/virtual');
		assert.equal(match.type, 'match');
		assert.equal(match.route.route, '/virtual');
		assert.equal(match.route.origin, 'external');
	});
});
