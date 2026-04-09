import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from '../../../dist/core/routing/router.js';
import { makeRoute, staticPart } from './test-helpers.js';

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
