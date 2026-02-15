import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPattern } from '../../../dist/core/routing/manifest/pattern.js';
import { Router } from '../../../dist/core/routing/router.js';

const staticPart = (content) => ({ content, dynamic: false, spread: false });
const dynamicPart = (content) => ({ content, dynamic: true, spread: false });
const spreadPart = (content) => ({ content, dynamic: true, spread: true });

const makeRoute = ({ segments, trailingSlash, route, pathname, isIndex = false }) => {
	const params = segments
		.flat()
		.filter((part) => part.dynamic)
		.map((part) => part.content);
	return {
		route,
		component: route,
		params,
		pathname,
		pattern: getPattern(segments, '/', trailingSlash),
		segments,
		type: 'page',
		prerender: false,
		fallbackRoutes: [],
		distURL: [],
		isIndex,
		origin: 'project',
	};
};

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
