import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ensure404Route } from '../../../dist/core/routing/astro-designed-error-pages.js';

describe('ensure404Route', () => {
	it('adds the default /404 route when none exists in the manifest', () => {
		const manifest: any = { routes: [] };
		ensure404Route(manifest);

		const route404 = manifest.routes.find((r: any) => r.route === '/404');
		assert.ok(route404, 'A /404 route should be added when none exists');
	});

	it('does not add a duplicate /404 route when one already exists', () => {
		const manifest: any = {
			routes: [
				{
					route: '/404',
					component: 'src/pages/404.astro',
					params: [],
					pathname: '/404',
					distURL: [],
					pattern: /^\/404\/?$/,
					segments: [[{ content: '404', dynamic: false, spread: false }]],
					type: 'page',
					prerender: false,
					fallbackRoutes: [],
					isIndex: false,
					origin: 'project',
				},
			],
		};
		ensure404Route(manifest);
		ensure404Route(manifest); // call twice to verify idempotency

		const count = manifest.routes.filter((r: any) => r.route === '/404').length;
		assert.equal(count, 1, 'There should be exactly one /404 route');
	});

	it('preserves the user-provided 404 component rather than substituting the default', () => {
		const userComponent = 'src/pages/404.astro';
		const manifest: any = {
			routes: [
				{
					route: '/404',
					component: userComponent,
					params: [],
					pathname: '/404',
					distURL: [],
					pattern: /^\/404\/?$/,
					segments: [[{ content: '404', dynamic: false, spread: false }]],
					type: 'page',
					prerender: false,
					fallbackRoutes: [],
					isIndex: false,
					origin: 'project',
				},
			],
		};
		ensure404Route(manifest);

		const route404 = manifest.routes.find((r: any) => r.route === '/404');
		assert.equal(
			route404?.component,
			userComponent,
			'User-provided 404 component should not be replaced by the default',
		);
	});

	it('does not affect /500 routes', () => {
		const manifest: any = {
			routes: [
				{
					route: '/500',
					component: 'src/pages/500.astro',
					params: [],
					pathname: '/500',
					distURL: [],
					pattern: /^\/500\/?$/,
					segments: [[{ content: '500', dynamic: false, spread: false }]],
					type: 'page',
					prerender: false,
					fallbackRoutes: [],
					isIndex: false,
					origin: 'project',
				},
			],
		};
		ensure404Route(manifest);

		// /404 should be added (no user 404 exists), /500 should be untouched
		const count500 = manifest.routes.filter((r: any) => r.route === '/500').length;
		assert.equal(count500, 1, '/500 route count should remain exactly 1');

		const has404 = manifest.routes.some((r: any) => r.route === '/404');
		assert.ok(has404, 'Default /404 should have been added');
	});
});
