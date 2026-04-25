import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.js';

describe('dev container', () => {
	describe('basic rendering', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-container/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('can render requests', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal(res.status, 200);
			assert.equal($('h1').length, 1);
		});
	});

	describe('injected dynamic routes', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-container/',
				output: 'server',
				integrations: [
					{
						name: '@astrojs/test-integration',
						hooks: {
							'astro:config:setup': ({ injectRoute }) => {
								injectRoute({
									pattern: '/another-[slug]',
									entrypoint: './src/components/test.astro',
								});
							},
						},
					},
				],
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Allows dynamic segments in injected routes', async () => {
			let res = await fixture.fetch('/test-one');
			assert.equal(res.status, 200);

			// Try with the injected route
			res = await fixture.fetch('/another-two');
			assert.equal(res.status, 200);
		});
	});

	describe('injected 404 route', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-container/',
				output: 'server',
				integrations: [
					{
						name: '@astrojs/test-integration',
						hooks: {
							'astro:config:setup': ({ injectRoute }) => {
								injectRoute({
									pattern: '/404',
									entrypoint: './src/components/404.astro',
								});
							},
						},
					},
				],
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Serves injected 404 route for any 404', async () => {
			// Regular pages are served as expected.
			let res = await fixture.fetch('/page');
			let html = await res.text();
			assert.ok(html.includes('Regular page'));
			assert.equal(res.status, 200);

			// `/404` serves the custom 404 page as expected.
			res = await fixture.fetch('/404');
			html = await res.text();
			assert.ok(html.includes('Custom 404'));
			assert.equal(res.status, 404);

			// A nonexistent page also serves the custom 404 page.
			res = await fixture.fetch('/other-page');
			html = await res.text();
			assert.ok(html.includes('Custom 404'));
			assert.equal(res.status, 404);
		});
	});

	describe('public/ with base', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-container/',
				base: '/sub/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('items in public/ are not available from root when using a base', async () => {
			// First try the subpath
			let res = await fixture.fetch('/sub/test.txt');
			assert.equal(res.status, 200);

			// Next try the root path
			res = await fixture.fetch('/test.txt');
			assert.equal(res.status, 404);
		});
	});

	describe('public/ without base', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-container/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('items in public/ are available from root when not using a base', async () => {
			const res = await fixture.fetch('/test.txt');
			assert.equal(res.status, 200);
		});
	});
});
