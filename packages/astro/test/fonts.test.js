// @ts-check
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fontProviders } from 'astro/config';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('astro:fonts', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {import('./test-utils.js').DevServer} */
	let devServer;

	describe('<Font /> component', () => {
		// TODO: remove once fonts are stabilized
		describe('Fonts are not enabled', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/fonts/',
				});
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer.stop();
			});

			it('Throws an error if fonts are not enabled', async () => {
				const res = await fixture.fetch('/');
				const body = await res.text();
				assert.equal(
					body.includes('<script type="module" src="/@vite/client">'),
					true,
					'Body does not include Vite error overlay script',
				);
			});
		});

		describe('Fonts are enabled', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/fonts/',
					experimental: {
						fonts: [
							{
								name: 'Roboto',
								cssVariable: '--font-roboto',
								provider: fontProviders.fontsource(),
							},
						],
					},
				});
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer.stop();
			});

			it('Includes styles', async () => {
				const res = await fixture.fetch('/');
				const html = await res.text();
				assert.equal(html.includes('<style>'), true);
			});

			it('Includes links when preloading', async () => {
				const res = await fixture.fetch('/preload');
				const html = await res.text();
				assert.equal(html.includes('<link rel="preload"'), true);
			});

			it('Has correct headers in dev', async () => {
				let res = await fixture.fetch('/preload');
				const html = await res.text();
				const $ = cheerio.load(html);
				const href = $('link[rel=preload][type^=font/woff2]').attr('href');

				if (!href) {
					assert.fail();
				}

				const headers = await fixture.fetch(href).then((r) => r.headers);
				assert.equal(headers.has('Content-Length'), true);
				assert.equal(headers.get('Content-Type'), 'font/woff2');
				assert.equal(
					headers.get('Cache-Control'),
					'no-store, no-cache, must-revalidate, max-age=0',
				);
				assert.equal(headers.get('Pragma'), 'no-cache');
				assert.equal(headers.get('Expires'), '0');
			});
		});
	});
});
