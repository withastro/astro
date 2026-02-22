import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from '../../../dist/core/routing/router.js';
import { dynamicPart, makeRoute, spreadPart, staticPart } from './test-helpers.js';

describe('dynamic route collision (unit)', () => {
	const trailingSlash = 'ignore';

	it('prefers static routes over dynamic routes', () => {
		const router = new Router(
			[
				makeRoute({
					segments: [[dynamicPart('slug')]],
					trailingSlash,
					route: '/[slug]',
					pathname: undefined,
				}),
				makeRoute({
					segments: [[staticPart('about')]],
					trailingSlash,
					route: '/about',
					pathname: '/about',
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);

		const match = router.match('/about');
		assert.equal(match.type, 'match');
		assert.equal(match.route.route, '/about');
	});

	it('prefers static nested index over spread routes', () => {
		const router = new Router(
			[
				makeRoute({
					segments: [[spreadPart('...slug')]],
					trailingSlash,
					route: '/[...slug]',
					pathname: undefined,
				}),
				makeRoute({
					segments: [[staticPart('test')]],
					trailingSlash,
					route: '/test',
					pathname: '/test',
					isIndex: true,
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);

		const match = router.match('/test');
		assert.equal(match.type, 'match');
		assert.equal(match.route.route, '/test');
	});

	it('prefers dynamic routes over spread routes for single segments', () => {
		const router = new Router(
			[
				makeRoute({
					segments: [[spreadPart('...slug')]],
					trailingSlash,
					route: '/[...slug]',
					pathname: undefined,
				}),
				makeRoute({
					segments: [[dynamicPart('slug')]],
					trailingSlash,
					route: '/[slug]',
					pathname: undefined,
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);

		const match = router.match('/blog');
		assert.equal(match.type, 'match');
		assert.equal(match.route.route, '/[slug]');
		assert.deepEqual(match.params, { slug: 'blog' });
	});
});
