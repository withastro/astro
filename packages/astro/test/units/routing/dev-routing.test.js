import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from '../../../dist/core/routing/router.js';
import { dynamicPart, makeRoute, staticPart } from './test-helpers.js';

describe('dev routing (unit)', () => {
	const trailingSlash = 'ignore';
	const routes = [
		makeRoute({ segments: [], trailingSlash, route: '/', pathname: '/', isIndex: true }),
		makeRoute({
			segments: [[staticPart('テスト')]],
			trailingSlash,
			route: '/テスト',
			pathname: '/テスト',
		}),
		makeRoute({
			segments: [[staticPart('te st')]],
			trailingSlash,
			route: '/te st',
			pathname: '/te st',
		}),
		makeRoute({
			segments: [[staticPart('another')]],
			trailingSlash,
			route: '/another',
			pathname: '/another',
		}),
		makeRoute({
			segments: [[dynamicPart('id')]],
			trailingSlash,
			route: '/[id]',
			pathname: undefined,
		}),
	];

	const router = new Router(routes, {
		base: '/',
		trailingSlash,
		buildFormat: 'directory',
	});

	it('matches root path', () => {
		assert.equal(router.match('/').type, 'match');
	});

	it('matches non-ASCII and space paths', () => {
		assert.equal(router.match('/テスト').type, 'match');
		assert.equal(router.match('/te st').type, 'match');
	});

	it('matches static and dynamic routes', () => {
		const staticMatch = router.match('/another');
		assert.equal(staticMatch.type, 'match');
		assert.equal(staticMatch.route.route, '/another');

		const dynamicMatch = router.match('/1');
		assert.equal(dynamicMatch.type, 'match');
		assert.deepEqual(dynamicMatch.params, { id: '1' });
	});

	it('does not normalize internal multiple slashes', () => {
		const match = router.match('/another///here');
		assert.equal(match.type, 'none');
	});

	it('redirects multiple leading slashes', () => {
		const match = router.match('/////');
		assert.equal(match.type, 'redirect');
		assert.equal(match.location, '/');
	});
});
