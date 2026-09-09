import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getRouteTable,
	matchAllRoutes,
	matchRoute,
	updateRouteTable,
} from '../../../dist/core/routing/route-table.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import { createManifest, createRouteInfo } from '../app/test-helpers.ts';
import { makeRoute, staticPart } from './test-helpers.ts';

function pageRoute(name: string): RouteData {
	return makeRoute({
		segments: [[staticPart(name)]],
		trailingSlash: 'ignore',
		route: `/${name}`,
		pathname: `/${name}`,
	});
}

describe('getRouteTable', () => {
	it('derives the route list from the manifest and ensures the default 404', () => {
		const about = pageRoute('about');
		const manifest = createManifest({ routes: [createRouteInfo(about)] });

		const table = getRouteTable(manifest);
		assert.deepEqual(
			table.routes.map((route) => route.route),
			['/about', '/404'],
		);
		// The derived list is fresh: manifest.routes is never mutated.
		assert.equal(manifest.routes.length, 1);
	});

	it('is memoized per manifest', () => {
		const manifest = createManifest({ routes: [createRouteInfo(pageRoute('about'))] });
		assert.equal(getRouteTable(manifest), getRouteTable(manifest));
	});

	it('matchRoute matches through the compiled router', () => {
		const about = pageRoute('about');
		const manifest = createManifest({ routes: [createRouteInfo(about)] });

		assert.equal(matchRoute(manifest, '/about'), about);
		assert.equal(matchRoute(manifest, '/missing'), undefined);
	});

	it('matchAllRoutes returns every match in priority order', () => {
		const about = pageRoute('about');
		const manifest = createManifest({ routes: [createRouteInfo(about)] });

		assert.deepEqual(matchAllRoutes(manifest, '/about'), [about]);
		assert.deepEqual(matchAllRoutes(manifest, '/missing'), []);
	});
});

describe('updateRouteTable', () => {
	it('replaces the table atomically for every consumer', () => {
		const about = pageRoute('about');
		const contact = pageRoute('contact');
		const manifest = createManifest({ routes: [createRouteInfo(about)] });

		const before = getRouteTable(manifest);
		assert.equal(matchRoute(manifest, '/about'), about);

		updateRouteTable(manifest, [contact]);

		const after = getRouteTable(manifest);
		// A fresh table entry: the old table object is swapped out whole, so the
		// route list and its compiled router can never disagree.
		assert.notEqual(after, before);
		assert.deepEqual(
			after.routes.map((route) => route.route),
			['/contact', '/404'],
		);
		assert.equal(matchRoute(manifest, '/contact'), contact);
		assert.equal(matchRoute(manifest, '/about'), undefined);
		// Stable until the next update.
		assert.equal(getRouteTable(manifest), after);
	});

	it("ensures the default 404 without mutating the caller's array", () => {
		const manifest = createManifest({ routes: [] });
		const newRoutes = [pageRoute('contact')];

		updateRouteTable(manifest, newRoutes);

		assert.equal(newRoutes.length, 1);
		assert.deepEqual(
			getRouteTable(manifest).routes.map((route) => route.route),
			['/contact', '/404'],
		);
	});

	it('keeps a user-supplied 404 route', () => {
		const custom404 = makeRoute({
			segments: [[staticPart('404')]],
			trailingSlash: 'ignore',
			route: '/404',
			pathname: '/404',
		});
		const manifest = createManifest({ routes: [] });

		updateRouteTable(manifest, [custom404]);

		const table = getRouteTable(manifest);
		assert.deepEqual(
			table.routes.map((route) => route.route),
			['/404'],
		);
		assert.equal(table.routes[0], custom404);
	});
});
