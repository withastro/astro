// @ts-check
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fontProviders } from 'astro/config';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('astro fonts', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('dev', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;

		describe('shared', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/fonts/',
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				});
				await fixture.clean();
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer?.stop();
			});

			it('Includes styles', async () => {
				const res = await fixture.fetch('/');
				const html = await res.text();
				const $ = cheerio.load(html);
				assert.equal(html.includes('<style>'), true);
				assert.equal($('link[rel=preload][type=font/woff2]').attr('href'), undefined);
			});

			it('Includes links when preloading', async () => {
				const res = await fixture.fetch('/preload');
				const html = await res.text();
				const $ = cheerio.load(html);
				const href = $('link[rel=preload][type=font/woff2]').attr('href');
				assert.equal(href?.startsWith('/_astro/fonts/'), true);
			});

			it('Can filter preloads', async () => {
				let res = await fixture.fetch('/preload');
				let html = await res.text();
				let $ = cheerio.load(html);
				const allPreloads = $('link[rel=preload][type=font/woff2]');

				res = await fixture.fetch('/granular-preload');
				html = await res.text();
				$ = cheerio.load(html);
				const filteredPreloads = $('link[rel=preload][type=font/woff2]');

				assert.equal(filteredPreloads.length < allPreloads.length, true);
			});

			it('Has correct headers in dev', async () => {
				const res = await fixture.fetch('/preload');
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

			it('Exposes fontData', async () => {
				const res = await fixture.fetch('/font-data');
				const html = await res.text();
				const $ = cheerio.load(html);
				const content = $('#data').html();
				if (!content) {
					assert.fail();
				}
				const parsed = JSON.parse(content);
				assert.equal('--font-test' in parsed, true);
				assert.equal(Array.isArray(parsed['--font-test']), true);
				assert.equal(parsed['--font-test'].length > 0, true);
				assert.equal(parsed['--font-test'][0].src[0].url.startsWith('/_astro/fonts/'), true);
			});

			it('Does not create dist folder or copy fonts when dev server stops', async () => {
				await fixture.fetch('/');
				assert.equal(existsSync(fixture.config.outDir), false);
			});
		});

		describe('Respects config to build links', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/fonts/',
					base: '/my-base',
					build: {
						assets: '_custom',
						assetsPrefix: 'https://cdn.example.com',
					},
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				});
				await fixture.clean();
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer?.stop();
			});

			it('works', async () => {
				const res = await fixture.fetch('/my-base/preload');
				const html = await res.text();
				const $ = cheerio.load(html);
				const href = $('link[rel=preload][type=font/woff2]').attr('href');
				assert.equal(href?.startsWith('/my-base/_custom/fonts/'), true);
			});
		});
	});

	describe('build', () => {
		describe('shared', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/fonts/',
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				});
				await fixture.build({});
			});

			it('Includes styles', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);
				assert.equal(html.includes('<style>'), true);
				assert.equal($('link[rel=preload][type=font/woff2]').attr('href'), undefined);
			});

			it('Includes links when preloading', async () => {
				const html = await fixture.readFile('/preload/index.html');
				const $ = cheerio.load(html);
				const href = $('link[rel=preload][type=font/woff2]').attr('href');
				assert.equal(href?.startsWith('/_astro/fonts/'), true);
			});

			it('Can filter preloads', async () => {
				let html = await fixture.readFile('/preload/index.html');
				let $ = cheerio.load(html);
				const allPreloads = $('link[rel=preload][type=font/woff2]');

				html = await fixture.readFile('/granular-preload/index.html');
				$ = cheerio.load(html);
				const filteredPreloads = $('link[rel=preload][type=font/woff2]');

				assert.equal(filteredPreloads.length < allPreloads.length, true);
			});

			it('Exposes fontData', async () => {
				const html = await fixture.readFile('/font-data/index.html');
				const $ = cheerio.load(html);
				const content = $('#data').html();
				if (!content) {
					assert.fail();
				}
				const parsed = JSON.parse(content);
				assert.equal('--font-test' in parsed, true);
				assert.equal(Array.isArray(parsed['--font-test']), true);
				assert.equal(parsed['--font-test'].length > 0, true);
				assert.equal(parsed['--font-test'][0].src[0].url.startsWith('/_astro/fonts/'), true);
			});
		});

		describe('Respects config to build links', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/fonts/',
					base: '/my-base',
					build: {
						assets: '_custom',
						assetsPrefix: 'https://cdn.example.com',
					},
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				});
				await fixture.build({});
			});

			it('works', async () => {
				const html = await fixture.readFile('/preload/index.html');
				const $ = cheerio.load(html);
				const href = $('link[rel=preload][type=font/woff2]').attr('href');
				assert.equal(href?.startsWith('https://cdn.example.com/my-base/_custom/fonts/'), true);
				const files = await readdir(new URL('./dist/_custom/fonts/', fixture.config.root));
				assert.equal(files.length > 0, true);
			});
		});
	});

	describe('ssr', () => {
		/** @type {(url: string) => Promise<string>} */
		let fixtureFetch;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/fonts/',
				output: 'server',
				adapter: testAdapter(),
				fonts: [
					{
						name: 'Poppins',
						cssVariable: '--font-test',
						provider: fontProviders.fontsource(),
						weights: [400, 500],
					},
				],
			});
			await fixture.build({});
			const app = await fixture.loadTestAdapterApp();
			fixtureFetch = async (url) => {
				const request = new Request(`http://example.com${url}`);
				const response = await app.render(request);
				const html = await response.text();
				return html;
			};
		});

		it('Includes styles', async () => {
			const html = await fixtureFetch('/');
			const $ = cheerio.load(html);
			assert.equal(html.includes('<style>'), true);
			assert.equal($('link[rel=preload][type=font/woff2]').attr('href'), undefined);
		});

		it('Includes links when preloading', async () => {
			const html = await fixtureFetch('/preload');
			const $ = cheerio.load(html);
			const href = $('link[rel=preload][type=font/woff2]').attr('href');
			assert.equal(href?.startsWith('/_astro/fonts/'), true);
		});

		it('Can filter preloads', async () => {
			let html = await fixtureFetch('/preload');
			let $ = cheerio.load(html);
			const allPreloads = $('link[rel=preload][type=font/woff2]');

			html = await fixtureFetch('/granular-preload');
			$ = cheerio.load(html);
			const filteredPreloads = $('link[rel=preload][type=font/woff2]');

			assert.equal(filteredPreloads.length < allPreloads.length, true);
		});

		it('Exposes fontData', async () => {
			const html = await fixtureFetch('/font-data');
			const $ = cheerio.load(html);
			const content = $('#data').html();
			if (!content) {
				assert.fail();
			}
			const parsed = JSON.parse(content);
			assert.equal('--font-test' in parsed, true);
			assert.equal(Array.isArray(parsed['--font-test']), true);
			assert.equal(parsed['--font-test'].length > 0, true);
			assert.equal(parsed['--font-test'][0].src[0].url.startsWith('/_astro/fonts/'), true);
		});
	});
});
