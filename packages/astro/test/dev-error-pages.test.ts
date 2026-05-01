import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Dev pipeline - error pages', () => {
	describe('Custom 404', () => {
		let fixture: Fixture;
		let devServer: DevServer;

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
		let fixture: Fixture;
		let devServer: DevServer;

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
});
