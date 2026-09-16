import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig } from '../../../dist/types/public/config.js';
import { Router } from '../../../dist/core/routing/router.js';
import { makeRoute, staticPart } from './test-helpers.ts';

/**
 * Helper to build a set of routes for the trailing slash tests.
 * Mirrors the original fixture's pages: api, dot.json, pathname, subpage,
 * plus optionally injected routes.
 */
function makeRoutes(
	trailingSlash: AstroConfig['trailingSlash'],
	{ injected = [] as ReturnType<typeof makeRoute>[] } = {},
) {
	const routes = [
		makeRoute({
			segments: [[staticPart('api')]],
			trailingSlash,
			route: '/api',
			pathname: '/api',
			type: 'endpoint',
		}),
		// Routes with file extensions always use trailingSlash: 'never' for their pattern
		makeRoute({
			segments: [[staticPart('dot.json')]],
			trailingSlash: 'never',
			route: '/dot.json',
			pathname: '/dot.json',
			type: 'endpoint',
		}),
		makeRoute({
			segments: [[staticPart('pathname')]],
			trailingSlash,
			route: '/pathname',
			pathname: '/pathname',
			type: 'endpoint',
		}),
		makeRoute({
			segments: [[staticPart('subpage')]],
			trailingSlash,
			route: '/subpage',
			pathname: '/subpage',
			type: 'endpoint',
		}),
		...injected,
	];
	return routes;
}

describe('trailingSlash', () => {
	// --- trailingSlash: 'always' ---
	describe("trailingSlash: 'always'", () => {
		const trailingSlash = 'always';
		const injected = [
			makeRoute({
				segments: [[staticPart('injected')]],
				trailingSlash,
				route: '/injected',
				pathname: '/injected',
				type: 'endpoint',
			}),
			// Routes with file extensions always use trailingSlash: 'never' for their
			// pattern, matching the behavior of trailingSlashForPath in create-manifest.ts
			makeRoute({
				segments: [[staticPart('injected.json')]],
				trailingSlash: 'never',
				route: '/injected.json',
				pathname: '/injected.json',
				type: 'endpoint',
			}),
		];
		const router = new Router(makeRoutes(trailingSlash, { injected }), {
			base: '/',
			trailingSlash,
			buildFormat: 'directory',
		});

		it('should match the API route when request has a trailing slash', () => {
			const match = router.match('/api/');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/api');
		});

		it('should NOT match the API route when request lacks a trailing slash', () => {
			const match = router.match('/api');
			assert.notEqual(match.type, 'match');
		});

		it('should match an injected route when request has a trailing slash', () => {
			const match = router.match('/injected/');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/injected');
		});

		it('should NOT match an injected route when request lacks a trailing slash', () => {
			const match = router.match('/injected');
			assert.notEqual(match.type, 'match');
		});

		it('should match an injected route when request has a file extension and no slash', () => {
			const match = router.match('/injected.json');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/injected.json');
		});

		it('should NOT match the API route when request has a trailing slash, with a file extension', () => {
			// dot.json with trailing slash should not match because file-extension routes use trailingSlash: 'never'
			const match = router.match('/dot.json/');
			assert.notEqual(match.type, 'match');
		});

		it('should also match the API route when request lacks a trailing slash, with a file extension', () => {
			const match = router.match('/dot.json');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/dot.json');
		});
	});

	// --- trailingSlash: 'never' with base path ---
	describe("trailingSlash: 'never' with base: '/base'", () => {
		const trailingSlash = 'never';
		const injected = [
			makeRoute({
				segments: [],
				trailingSlash,
				route: '/',
				pathname: '/',
				type: 'endpoint',
				isIndex: true,
			}),
			makeRoute({
				segments: [[staticPart('injected')]],
				trailingSlash,
				route: '/injected',
				pathname: '/injected',
				type: 'endpoint',
			}),
		];
		const router = new Router(makeRoutes(trailingSlash, { injected }), {
			base: '/base',
			trailingSlash,
			buildFormat: 'directory',
		});

		it('should not have trailing slash on root path when base is set and trailingSlash is never', () => {
			const match = router.match('/base');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/');
		});

		it('should not match root path with trailing slash when base is set and trailingSlash is never', () => {
			const match = router.match('/base/');
			// Should redirect (trailing slash removal) rather than match
			assert.notEqual(match.type, 'match');
		});

		it('should match root path with query params when base is set and trailingSlash is never', () => {
			// Query params are stripped before routing, so /base?foo=bar resolves as /base
			const match = router.match('/base');
			assert.equal(match.type, 'match');
		});

		it('should match sub path with query params when base is set and trailingSlash is never', () => {
			// Query params are stripped before routing, so /base/injected?foo=bar resolves as /base/injected
			const match = router.match('/base/injected');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/injected');
		});

		it('should match pathname route under base', () => {
			const match = router.match('/base/pathname');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/pathname');
			assert.equal(match.pathname, '/pathname');
		});

		it('should match subpage route under base', () => {
			const match = router.match('/base/subpage');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/subpage');
			assert.equal(match.pathname, '/subpage');
		});
	});

	// --- trailingSlash: 'never' with base: '/mybase' (issue #13736) ---
	describe("trailingSlash: 'never' with base: '/mybase'", () => {
		const trailingSlash = 'never';
		const injected = [
			makeRoute({
				segments: [],
				trailingSlash,
				route: '/',
				pathname: '/',
				type: 'endpoint',
				isIndex: true,
			}),
		];
		const router = new Router(makeRoutes(trailingSlash, { injected }), {
			base: '/mybase',
			trailingSlash,
			buildFormat: 'directory',
		});

		it('should match root path without trailing slash when base is set and trailingSlash is never', () => {
			const match = router.match('/mybase');
			assert.equal(match.type, 'match');
			assert.equal(match.route.route, '/');
			// The resolved pathname should not have a trailing slash
			assert.equal(match.pathname, '/');
		});
	});
});
