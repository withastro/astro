import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CacheOptions } from '../../../dist/core/cache/types.js';
import {
	compileCacheRoutes,
	matchCacheRoute,
} from '../../../dist/core/cache/runtime/route-matching.js';

/**
 * Helper: compile routes with default base '/' and trailingSlash 'ignore'.
 */
function compile(routes: Record<string, CacheOptions>) {
	return compileCacheRoutes(routes, '/', 'ignore');
}

describe('compileCacheRoutes', () => {
	it('compiles an exact static path', () => {
		const compiled = compile({ '/about': { maxAge: 60 } });
		assert.equal(compiled.length, 1);
		assert.ok(compiled[0].pattern instanceof RegExp);
		assert.equal(compiled[0].route, '/about');
		assert.deepEqual(compiled[0].options, { maxAge: 60 });
	});

	it('compiles a dynamic parameter route', () => {
		const compiled = compile({ '/blog/[slug]': { maxAge: 120 } });
		assert.equal(compiled.length, 1);
		assert.ok(compiled[0].pattern instanceof RegExp);
		assert.equal(compiled[0].route, '/blog/[slug]');
	});

	it('compiles a rest parameter route', () => {
		const compiled = compile({ '/docs/[...path]': { maxAge: 300 } });
		assert.equal(compiled.length, 1);
		assert.ok(compiled[0].pattern instanceof RegExp);
		assert.equal(compiled[0].route, '/docs/[...path]');
	});

	it('returns empty array for empty routes', () => {
		const compiled = compile({});
		assert.deepEqual(compiled, []);
	});

	it('sorts most specific (static) before dynamic before rest', () => {
		const compiled = compile({
			'/docs/[...path]': { maxAge: 300 },
			'/docs/[slug]': { maxAge: 200 },
			'/docs/intro': { maxAge: 100 },
		});
		assert.equal(compiled.length, 3);
		// Static route should be first (most specific)
		assert.equal(compiled[0].route, '/docs/intro');
		// Dynamic parameter should be second
		assert.equal(compiled[1].route, '/docs/[slug]');
		// Rest parameter should be last (least specific)
		assert.equal(compiled[2].route, '/docs/[...path]');
	});

	it('sorts multiple static routes alphabetically by segments', () => {
		const compiled = compile({
			'/z-page': { maxAge: 10 },
			'/a-page': { maxAge: 20 },
		});
		assert.equal(compiled.length, 2);
		// Both are static; sorted by Astro's comparator
		// Astro sorts static routes by segments, so /a-page comes first
		assert.equal(compiled[0].route, '/a-page');
		assert.equal(compiled[1].route, '/z-page');
	});
});

describe('matchCacheRoute', () => {
	it('matches an exact static path', () => {
		const compiled = compile({ '/about': { maxAge: 60 } });
		const result = matchCacheRoute('/about', compiled);
		assert.deepEqual(result, { maxAge: 60 });
	});

	it('matches with trailing slash', () => {
		const compiled = compile({ '/about': { maxAge: 60 } });
		const result = matchCacheRoute('/about/', compiled);
		assert.deepEqual(result, { maxAge: 60 });
	});

	it('returns null when no route matches', () => {
		const compiled = compile({ '/about': { maxAge: 60 } });
		const result = matchCacheRoute('/contact', compiled);
		assert.equal(result, null);
	});

	it('matches a dynamic parameter [slug]', () => {
		const compiled = compile({ '/blog/[slug]': { maxAge: 120 } });
		assert.deepEqual(matchCacheRoute('/blog/hello-world', compiled), { maxAge: 120 });
		assert.deepEqual(matchCacheRoute('/blog/another-post', compiled), { maxAge: 120 });
	});

	it('dynamic [slug] does not match multiple segments', () => {
		const compiled = compile({ '/blog/[slug]': { maxAge: 120 } });
		// [slug] should only match a single segment
		assert.equal(matchCacheRoute('/blog/a/b', compiled), null);
	});

	it('matches a rest parameter [...path]', () => {
		const compiled = compile({ '/docs/[...path]': { maxAge: 300 } });
		assert.deepEqual(matchCacheRoute('/docs/intro', compiled), { maxAge: 300 });
		assert.deepEqual(matchCacheRoute('/docs/a/b/c', compiled), { maxAge: 300 });
		assert.deepEqual(matchCacheRoute('/docs/', compiled), { maxAge: 300 });
	});

	it('most specific route wins when multiple match', () => {
		const compiled = compile({
			'/docs/[...path]': { maxAge: 300 },
			'/docs/[slug]': { maxAge: 200 },
			'/docs/intro': { maxAge: 100 },
		});
		// Static match wins over dynamic and rest
		assert.deepEqual(matchCacheRoute('/docs/intro', compiled), { maxAge: 100 });
		// Dynamic match wins over rest for single-segment paths
		assert.deepEqual(matchCacheRoute('/docs/other', compiled), { maxAge: 200 });
		// Rest match for multi-segment paths
		assert.deepEqual(matchCacheRoute('/docs/a/b', compiled), { maxAge: 300 });
	});

	it('returns null for empty compiled routes', () => {
		const result = matchCacheRoute('/anything', []);
		assert.equal(result, null);
	});

	it('handles root path /', () => {
		const compiled = compile({ '/': { maxAge: 60 } });
		assert.deepEqual(matchCacheRoute('/', compiled), { maxAge: 60 });
	});

	it('handles complex nested routes', () => {
		const compiled = compile({
			'/api/v1/[resource]/[id]': { maxAge: 30 },
		});
		assert.deepEqual(matchCacheRoute('/api/v1/users/123', compiled), { maxAge: 30 });
		assert.equal(matchCacheRoute('/api/v1/users', compiled), null);
		assert.equal(matchCacheRoute('/api/v1/users/123/extra', compiled), null);
	});
});

describe('route pattern combinations', () => {
	it('matches a [param] followed by a [...rest]', () => {
		const compiled = compile({ '/api/[version]/[...path]': { maxAge: 30 } });
		assert.deepEqual(matchCacheRoute('/api/v1/users', compiled), { maxAge: 30 });
		assert.deepEqual(matchCacheRoute('/api/v1/users/123', compiled), { maxAge: 30 });
		// Requires at least the [version] segment.
		assert.equal(matchCacheRoute('/api', compiled), null);
	});

	it('uses a [...rest] parameter to match a whole group of routes', () => {
		// This is the supported replacement for a glob like `/products/*`.
		const compiled = compile({ '/products/[...slug]': { maxAge: 3600 } });
		assert.deepEqual(matchCacheRoute('/products/123', compiled), { maxAge: 3600 });
		assert.deepEqual(matchCacheRoute('/products/shoes/running', compiled), { maxAge: 3600 });
	});

	it('treats `*` as a literal character, not a glob wildcard', () => {
		// Glob wildcards are not supported. A `*` is matched literally, so
		// `/products/[id]/*` only matches a path whose last segment is `*`.
		const compiled = compile({ '/products/[id]/*': { maxAge: 60 } });
		assert.deepEqual(matchCacheRoute('/products/123/*', compiled), { maxAge: 60 });
		assert.equal(matchCacheRoute('/products/123/reviews', compiled), null);
	});

	it('matches sub-paths with [...rest] where a glob would be expected', () => {
		const compiled = compile({ '/products/[id]/[...rest]': { maxAge: 60 } });
		assert.deepEqual(matchCacheRoute('/products/123/reviews', compiled), { maxAge: 60 });
		assert.deepEqual(matchCacheRoute('/products/123/reviews/5', compiled), { maxAge: 60 });
	});
});
