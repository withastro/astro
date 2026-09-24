import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from '../../../dist/core/routing/router.js';
import { makeRoute, spreadPart } from './test-helpers.ts';

describe('Route sanitization', () => {
	it('should correctly match a route param with a trailing slash in its value', () => {
		const trailingSlash = 'never';
		const routes = [
			makeRoute({
				segments: [[spreadPart('...testSlashTrim')]],
				trailingSlash,
				route: '/[...testslashtrim]',
				pathname: undefined,
			}),
		];

		const router = new Router(routes, {
			base: '/',
			trailingSlash,
			buildFormat: 'directory',
		});

		const match = router.match('/a-route-param-with-leading-trailing-slash');
		assert.equal(match.type, 'match');
		assert.equal(match.route.route, '/[...testslashtrim]');
		assert.deepEqual(match.params, {
			testSlashTrim: 'a-route-param-with-leading-trailing-slash',
		});
	});
});
