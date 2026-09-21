// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findAllRouteCandidatesToRewrite } from '../../../dist/core/routing/rewrite.js';
import { dynamicPart, makeRoute, spreadPart, staticPart } from './test-helpers.ts';

// Builds a minimal request for the rewrite helper.
function fakeRequest(url = 'http://example.com/') {
	return new Request(url);
}

describe('findAllRouteCandidatesToRewrite', () => {
	it('returns all matching candidates when multiple dynamic routes match (#18089)', () => {
		// [year]/index.astro sorts before [...slug].astro, and both patterns
		// match "/about/". In dev distURL is empty, so the caller must iterate
		// candidates and validate each via getStaticPaths().
		const yearRoute = makeRoute({
			route: '/[year]',
			segments: [[dynamicPart('year')]],
			trailingSlash: 'always',
			pathname: undefined,
		});
		const slugRoute = makeRoute({
			route: '/[...slug]',
			segments: [[spreadPart('...slug')]],
			trailingSlash: 'always',
			pathname: undefined,
		});

		const result = findAllRouteCandidatesToRewrite({
			payload: '/about/',
			routes: [yearRoute, slugRoute],
			request: fakeRequest(),
			trailingSlash: 'always',
			buildFormat: 'directory',
			base: '/',
		});

		// Both routes should be returned as candidates.
		assert.equal(result.candidates.length, 2);
		assert.equal(result.candidates[0].route, '/[year]');
		assert.equal(result.candidates[1].route, '/[...slug]');
		assert.equal(result.pathname, '/about/');
	});

	it('returns a single candidate when only one route matches', () => {
		const aboutRoute = makeRoute({
			route: '/about',
			segments: [[staticPart('about')]],
			trailingSlash: 'ignore',
			pathname: '/about',
		});
		const blogRoute = makeRoute({
			route: '/blog',
			segments: [[staticPart('blog')]],
			trailingSlash: 'ignore',
			pathname: '/blog',
		});

		const result = findAllRouteCandidatesToRewrite({
			payload: '/about',
			routes: [aboutRoute, blogRoute],
			request: fakeRequest(),
			trailingSlash: 'ignore',
			buildFormat: 'directory',
			base: '/',
		});

		assert.equal(result.candidates.length, 1);
		assert.equal(result.candidates[0].route, '/about');
	});

	it('returns the 404 route when no route matches', () => {
		const yearRoute = makeRoute({
			route: '/[year]',
			segments: [[dynamicPart('year')]],
			trailingSlash: 'ignore',
			pathname: undefined,
		});
		const notFoundRoute = makeRoute({
			route: '/404',
			segments: [[staticPart('404')]],
			trailingSlash: 'ignore',
			pathname: '/404',
			component: '404.astro',
		});

		const result = findAllRouteCandidatesToRewrite({
			// Path that doesn't match [year] (has a nested segment)
			payload: '/a/b/c',
			routes: [yearRoute, notFoundRoute],
			request: fakeRequest(),
			trailingSlash: 'ignore',
			buildFormat: 'directory',
			base: '/',
		});

		assert.equal(result.candidates.length, 1);
		assert.equal(result.candidates[0].route, '/404');
	});

	it('gives 404 error route precedence over dynamic matches', () => {
		const slugRoute = makeRoute({
			route: '/[...slug]',
			segments: [[spreadPart('...slug')]],
			trailingSlash: 'ignore',
			pathname: undefined,
		});
		const notFoundRoute = makeRoute({
			route: '/404',
			segments: [[staticPart('404')]],
			trailingSlash: 'ignore',
			pathname: '/404',
			component: '404.astro',
		});

		const result = findAllRouteCandidatesToRewrite({
			payload: '/404',
			routes: [slugRoute, notFoundRoute],
			request: fakeRequest(),
			trailingSlash: 'ignore',
			buildFormat: 'directory',
			base: '/',
		});

		// 404 error route takes precedence: only it should be returned.
		assert.equal(result.candidates.length, 1);
		assert.equal(result.candidates[0].route, '/404');
	});

	it('normalizes the URL and pathname the same way findRouteToRewrite does', () => {
		const pageRoute = makeRoute({
			route: '/page',
			segments: [[staticPart('page')]],
			trailingSlash: 'always',
			pathname: '/page',
		});

		const result = findAllRouteCandidatesToRewrite({
			payload: '/page/',
			routes: [pageRoute],
			request: fakeRequest(),
			trailingSlash: 'always',
			buildFormat: 'directory',
			base: '/',
		});

		assert.equal(result.candidates.length, 1);
		assert.equal(result.newUrl.pathname, '/page/');
	});
});
