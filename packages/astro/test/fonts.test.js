// @ts-check
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { fontProviders } from 'astro/config';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

/**
 * @param {Omit<import("./test-utils.js").AstroInlineConfig, 'root'>} inlineConfig
 */
async function createDevFixture(inlineConfig) {
	const fixture = await loadFixture({ root: './fixtures/fonts/', ...inlineConfig });
	await fixture.clean();
	const devServer = await fixture.startDevServer();

	return {
		fixture,
		devServer,
		run: async (/** @type {() => any} */ cb) => {
			try {
				return await cb();
			} finally {
				await devServer.stop();
			}
		},
	};
}

/**
 * @param {Omit<import("./test-utils.js").AstroInlineConfig, 'root'>} inlineConfig
 */
async function createBuildFixture(inlineConfig) {
	const fixture = await loadFixture({ root: './fixtures/fonts/', ...inlineConfig });
	await fixture.build({});

	return {
		fixture,
	};
}

/**
 * @param {Omit<import("./test-utils.js").AstroInlineConfig, 'root'>} inlineConfig
 */
async function createSsrFixture(inlineConfig) {
	const fixture = await loadFixture({
		root: './fixtures/fonts/',
		output: 'server',
		adapter: testAdapter(),
		...inlineConfig,
	});
	await fixture.build({});
	const app = await fixture.loadTestAdapterApp();

	return {
		fixture,
		app,
		/**
		 * @param {string} url
		 */
		fetch: async (url) => {
			const request = new Request(`http://example.com${url}`);
			const response = await app.render(request);
			const html = await response.text();
			return html;
		},
	};
}

describe('astro fonts', () => {
	describe('dev', () => {
		it('Includes styles', async () => {
			const { fixture, run } = await createDevFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			await run(async () => {
				const res = await fixture.fetch('/');
				const html = await res.text();
				const $ = cheerio.load(html);
				assert.equal(html.includes('<style>'), true);
				assert.equal($('link[rel=preload][type=font/woff2]').attr('href'), undefined);
			});
		});

		it('Includes links when preloading', async () => {
			const { fixture, run } = await createDevFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			await run(async () => {
				const res = await fixture.fetch('/preload');
				const html = await res.text();
				const $ = cheerio.load(html);
				const href = $('link[rel=preload][type=font/woff2]').attr('href');
				assert.equal(href?.startsWith('/_astro/fonts/'), true);
			});
		});

		it('Can filter preloads', async () => {
			const { fixture, run } = await createDevFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			await run(async () => {
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
		});

		it('Has correct headers in dev', async () => {
			const { fixture, run } = await createDevFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});

			await run(async () => {
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
		});

		it('Respects config to build links', async () => {
			const { fixture, run } = await createDevFixture({
				base: '/my-base',
				build: {
					assets: '_custom',
					assetsPrefix: 'https://cdn.example.com',
				},
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			await run(async () => {
				const res = await fixture.fetch('/my-base/preload');
				const html = await res.text();
				const $ = cheerio.load(html);
				const href = $('link[rel=preload][type=font/woff2]').attr('href');
				assert.equal(href?.startsWith('/my-base/_custom/fonts/'), true);
			});
		});

		it('Exposes fontData', async () => {
			const { fixture, run } = await createDevFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
						},
					],
				},
			});
			await run(async () => {
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
		});

		it('Exposes buffer in getFontBuffer()', async () => {
			const { fixture, run } = await createDevFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
						},
					],
				},
			});
			await run(async () => {
				const res = await fixture.fetch('/get-font-buffer');
				const html = await res.text();
				const $ = cheerio.load(html);
				const length = $('#length').html();
				if (!length) {
					assert.fail();
				}
				assert.equal(length === '0', false);
			});
		});

		it('Does not create dist folder or copy fonts when dev server stops', async () => {
			const { fixture, run } = await createDevFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			await run(async () => {
				await fixture.fetch('/');
			});
			assert.equal(existsSync(fixture.config.outDir), false);
		});
	});

	describe('build', () => {
		it('Includes styles', async () => {
			const { fixture } = await createBuildFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			assert.equal(html.includes('<style>'), true);
			assert.equal($('link[rel=preload][type=font/woff2]').attr('href'), undefined);
		});

		it('Includes links when preloading', async () => {
			const { fixture } = await createBuildFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			const html = await fixture.readFile('/preload/index.html');
			const $ = cheerio.load(html);
			const href = $('link[rel=preload][type=font/woff2]').attr('href');
			assert.equal(href?.startsWith('/_astro/fonts/'), true);
		});

		it('Can filter preloads', async () => {
			const { fixture } = await createBuildFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});

			let html = await fixture.readFile('/preload/index.html');
			let $ = cheerio.load(html);
			const allPreloads = $('link[rel=preload][type=font/woff2]');

			html = await fixture.readFile('/granular-preload/index.html');
			$ = cheerio.load(html);
			const filteredPreloads = $('link[rel=preload][type=font/woff2]');

			assert.equal(filteredPreloads.length < allPreloads.length, true);
		});

		it('Respects config to build links', async () => {
			const { fixture } = await createBuildFixture({
				base: '/my-base',
				build: {
					assets: '_custom',
					assetsPrefix: 'https://cdn.example.com',
				},
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			const html = await fixture.readFile('/preload/index.html');
			const $ = cheerio.load(html);
			const href = $('link[rel=preload][type=font/woff2]').attr('href');
			assert.equal(href?.startsWith('https://cdn.example.com/my-base/_custom/fonts/'), true);
			const files = await readdir(new URL('./dist/_custom/fonts/', fixture.config.root));
			assert.equal(files.length > 0, true);
		});

		it('Exposes fontData', async () => {
			const { fixture } = await createBuildFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
						},
					],
				},
			});

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

		it('Exposes buffer in getFontBuffer()', async () => {
			const { fixture } = await createBuildFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
						},
					],
				},
			});
			const html = await fixture.readFile('/get-font-buffer/index.html');
			const $ = cheerio.load(html);
			const length = $('#length').html();
			if (!length) {
				assert.fail();
			}
			assert.equal(length === '0', false);
		});
	});

	describe('ssr', () => {
		it('Includes styles', async () => {
			const fixture = await createSsrFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			const html = await fixture.fetch('/');
			const $ = cheerio.load(html);
			assert.equal(html.includes('<style>'), true);
			assert.equal($('link[rel=preload][type=font/woff2]').attr('href'), undefined);
		});

		it('Includes links when preloading', async () => {
			const fixture = await createSsrFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});
			const html = await fixture.fetch('/preload');
			const $ = cheerio.load(html);
			const href = $('link[rel=preload][type=font/woff2]').attr('href');
			assert.equal(href?.startsWith('/_astro/fonts/'), true);
		});

		it('Can filter preloads', async () => {
			const fixture = await createSsrFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
							weights: [400, 500],
						},
					],
				},
			});

			let html = await fixture.fetch('/preload');
			let $ = cheerio.load(html);
			const allPreloads = $('link[rel=preload][type=font/woff2]');

			html = await fixture.fetch('/granular-preload');
			$ = cheerio.load(html);
			const filteredPreloads = $('link[rel=preload][type=font/woff2]');

			assert.equal(filteredPreloads.length < allPreloads.length, true);
		});

		it('Exposes fontData', async () => {
			const fixture = await createSsrFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
						},
					],
				},
			});

			const html = await fixture.fetch('/font-data');
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

		it('Exposes buffer in getFontBuffer()', async () => {
			const fixture = await createSsrFixture({
				experimental: {
					fonts: [
						{
							name: 'Poppins',
							cssVariable: '--font-test',
							provider: fontProviders.fontsource(),
						},
					],
				},
			});
			const html = await fixture.fetch('/get-font-buffer');
			const $ = cheerio.load(html);
			const length = $('#length').html();
			if (!length) {
				assert.fail();
			}
			assert.equal(length === '0', false);
		});
	});
});
