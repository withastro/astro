// @ts-check
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { fontProviders } from 'astro/config';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

/**
 * @param {Omit<import("./test-utils.js").AstroInlineConfig, 'root'>} inlineConfig
 */
async function createDevFixture(inlineConfig) {
	const fixture = await loadFixture({ root: './fixtures/fonts/', ...inlineConfig });
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

describe('astro fonts', () => {
	describe('dev', () => {
		it('Includes styles', async () => {
			const { fixture, run } = await createDevFixture({
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
							name: 'Roboto',
							cssVariable: '--font-roboto',
							provider: fontProviders.fontsource(),
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

		it('Has correct headers in dev', async () => {
			const { fixture, run } = await createDevFixture({
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
					assetsPrefix: 'https//cdn.example.com',
				},
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
			await run(async () => {
				const res = await fixture.fetch('/my-base/preload');
				const html = await res.text();
				const $ = cheerio.load(html);
				const href = $('link[rel=preload][type=font/woff2]').attr('href');
				assert.equal(href?.startsWith('/my-base/_custom/fonts/'), true);
			});
		});
	});

	describe('build', () => {
		it('Includes styles', async () => {
			const { fixture } = await createBuildFixture({
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
							name: 'Roboto',
							cssVariable: '--font-roboto',
							provider: fontProviders.fontsource(),
						},
					],
				},
			});
			const html = await fixture.readFile('/preload/index.html');
			const $ = cheerio.load(html);
			const href = $('link[rel=preload][type=font/woff2]').attr('href');
			assert.equal(href?.startsWith('/_astro/fonts/'), true);
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
							name: 'Roboto',
							cssVariable: '--font-roboto',
							provider: fontProviders.fontsource(),
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
	});
});
