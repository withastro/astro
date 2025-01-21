import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { ServerOnlyModule } from '../dist/core/errors/errors-data.js';
import { AstroError } from '../dist/core/errors/index.js';
import { loadFixture } from './test-utils.js';

describe('astro:manifest/client', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	describe('when the experimental flag is not enabled', async () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest/',
				experimental: {
					serializeManifest: false,
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should throw an error when importing the module', async () => {
			const response = await fixture.fetch('/');
			const html = await response.text();
			assert.match(html, /CantUseManifestModule/);
		});
	});

	describe('when the experimental flag is enabled', async () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should return the expected properties', async () => {
			const response = await fixture.fetch('/');
			const html = await response.text();

			const $ = cheerio.load(html);

			assert.deepEqual(
				$('#config').text(),
				JSON.stringify({
					base: '/',
					i18n: {
						defaultLocale: 'en',
						locales: ['en', 'fr'],
						routing: {
							prefixDefaultLocale: false,
							redirectToDefaultLocale: true,
							fallbackType: 'redirect',
						},
					},
					build: {
						format: 'directory',
						redirects: true,
					},
					trailingSlash: 'ignore',
					compressHTML: true,
					site: 'https://astro.build/',
					legacy: {
						collections: false,
					},
				}),
			);
		});
	});
});

describe('astro:manifest/server', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	describe('when build', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest/',
			});
		});

		it('should return an error when using inside a client script', async () => {
			const error = await fixture.build().catch((err) => err);
			assert.equal(error instanceof AstroError, true);
			assert.equal(error.name, ServerOnlyModule.name);
		});
	});

	describe('when the experimental flag is not enabled', async () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest/',
				experimental: {
					serializeManifest: false,
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should throw an error when importing the module', async () => {
			const response = await fixture.fetch('/server');
			const html = await response.text();
			assert.match(html, /CantUseManifestModule/);
		});
	});

	describe('when the experimental flag is enabled', async () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should return the expected properties', async () => {
			const response = await fixture.fetch('/server');
			const html = await response.text();

			const $ = cheerio.load(html);

			assert.ok($('#out-dir').text().endsWith('/dist/'));
			assert.ok($('#src-dir').text().endsWith('/src/'));
			assert.ok($('#cache-dir').text().endsWith('/.astro/'));
			assert.ok($('#root').text().endsWith('/'));
			assert.ok($('#build-client').text().endsWith('/dist/client/'));
			assert.ok($('#build-server').text().endsWith('/dist/server/'));
		});
	});
});
