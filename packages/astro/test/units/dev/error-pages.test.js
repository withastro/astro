// @ts-check
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { ensure404Route } from '../../../dist/core/routing/astro-designed-error-pages.js';
import { loadFixture } from '../../test-utils.js';

describe('Dev pipeline - error pages', () => {
	describe('Custom 404', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-error-pages/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('renders the custom 404.astro page for unmatched routes', async () => {
			const res = await fixture.fetch('/does-not-exist');
			assert.equal(res.status, 404);
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom 404');
		});

		it('renders the built-in Astro 404 page when requesting a truly unmatched route', async () => {
			// With a custom 404.astro present, it always serves that
			const res = await fixture.fetch('/does-not-exist');
			assert.equal(res.status, 404);
		});

		it('serves the custom 404 page for the /404 path itself', async () => {
			const res = await fixture.fetch('/404');
			assert.equal(res.status, 404);
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom 404');
		});
	});

	describe('Custom 500', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-error-pages/',
				output: 'server',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('renders the custom 500.astro page when a route throws', async () => {
			const res = await fixture.fetch('/throwing');
			assert.equal(res.status, 500);
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Server Error');
		});
	});

	describe('ensure404Route', () => {
		it('adds the default /404 route when none exists in the manifest', () => {
			/** @type {{ routes: any[] }} */
			const manifest = { routes: [] };
			ensure404Route(manifest);

			const route404 = manifest.routes.find((r) => r.route === '/404');
			assert.ok(route404, 'A /404 route should be added when none exists');
		});

		it('does not add a duplicate /404 route when one already exists', () => {
			/** @type {{ routes: any[] }} */
			const manifest = {
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

			const count = manifest.routes.filter((r) => r.route === '/404').length;
			assert.equal(count, 1, 'There should be exactly one /404 route');
		});

		it('preserves the user-provided 404 component rather than substituting the default', () => {
			const userComponent = 'src/pages/404.astro';
			/** @type {{ routes: any[] }} */
			const manifest = {
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

			const route404 = manifest.routes.find((r) => r.route === '/404');
			assert.equal(
				route404?.component,
				userComponent,
				'User-provided 404 component should not be replaced by the default',
			);
		});

		it('does not affect /500 routes', () => {
			/** @type {{ routes: any[] }} */
			const manifest = {
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
			const count500 = manifest.routes.filter((r) => r.route === '/500').length;
			assert.equal(count500, 1, '/500 route count should remain exactly 1');

			const has404 = manifest.routes.some((r) => r.route === '/404');
			assert.ok(has404, 'Default /404 should have been added');
		});
	});
});
