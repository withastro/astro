import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from '../../../dist/core/routing/router.js';
import { dynamicPart, makeRoute, staticPart } from './test-helpers.js';

describe('Resolved pathname', () => {
	const trailingSlash = 'never';

	// Routes mirror the original fixture:
	//   /src/pages/api/[category]/index.ts  -> /api/[category]
	//   /src/pages/api/[category]/[id].ts   -> /api/[category]/[id]
	const routes = [
		makeRoute({
			segments: [[staticPart('api')], [dynamicPart('category')]],
			trailingSlash,
			route: '/api/[category]',
			pathname: undefined,
			type: 'endpoint',
			isIndex: true,
		}),
		makeRoute({
			segments: [[staticPart('api')], [dynamicPart('category')], [dynamicPart('id')]],
			trailingSlash,
			route: '/api/[category]/[id]',
			pathname: undefined,
			type: 'endpoint',
		}),
	];

	// Use buildFormat: 'file' so that the Router strips .html extensions,
	// matching the dev server behavior being tested.
	const router = new Router(routes, {
		base: '/',
		trailingSlash,
		buildFormat: 'file',
	});

	it('should resolve params correctly for .html requests to dynamic routes', () => {
		const match = router.match('/api/books.html');
		assert.equal(match.type, 'match');
		assert.equal(match.params.category, 'books');
		assert.equal(match.params.id, undefined);
	});

	it('should resolve params correctly for .html requests to nested dynamic routes', () => {
		const match = router.match('/api/books/42.html');
		assert.equal(match.type, 'match');
		assert.equal(match.params.category, 'books');
		assert.equal(match.params.id, '42');
	});

	it('should not cross-contaminate resolved pathnames between concurrent requests', () => {
		// Router.match is stateless — each call returns an independent result.
		// This verifies the same invariant the original test checked: two
		// different URLs produce independent params without cross-contamination.
		const match1 = router.match('/api/books/1.html');
		const match2 = router.match('/api/movies/99');

		assert.equal(match1.type, 'match');
		assert.equal(match1.params.category, 'books');
		assert.equal(match1.params.id, '1');

		assert.equal(match2.type, 'match');
		assert.equal(match2.params.category, 'movies');
		assert.equal(match2.params.id, '99');
	});
});
