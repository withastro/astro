import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { ServerOnlyModule } from '../dist/core/errors/errors-data.js';
import { AstroError } from '../dist/core/errors/index.js';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('astro:config/client', () => {
	let fixture: Fixture;

	describe('when the experimental flag is enabled in build', async () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest/',
				outDir: './dist/serializeManifest-when-the-experimental-flag-is-enabled-in/',
			});
			await fixture.build();
		});

		it('should return the expected properties', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.deepEqual(
				$('#config').text(),
				JSON.stringify({
					base: '/blog',
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
					},
					trailingSlash: 'always',
					compressHTML: true,
					site: 'https://example.com',
				}),
			);
		});
	});
});

describe('astro:config/client in a client script', () => {
	let fixture: Fixture;

	describe('when build', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest-client-script/',
				adapter: testAdapter(),
				output: 'server',
				outDir: './dist/serializeManifest-when-build/',
			});
		});

		it('should build without errors when astro:config/client is used in a client script', async () => {
			const error = await fixture.build().catch((err) => err);
			assert.equal(error, undefined, `Build failed with: ${error?.message}`);
		});
	});
});

describe('astro:config/server', () => {
	let fixture: Fixture;
	let app: App;

	describe('when build', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest-invalid/',
				outDir: './dist/serializeManifest-when-build/',
			});
		});

		it('should return an error when using inside a client script', async () => {
			const error = await fixture.build().catch((err) => err);
			assert.equal(error instanceof AstroError, true);
			assert.equal(error.name, ServerOnlyModule.name);
		});
	});

	describe('when the experimental flag is enabled in build', async () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest/',
				outDir: './dist/serializeManifest-when-the-experimental-flag-is-enabled-in/',
			});
			await fixture.build();
		});

		it('should return the expected properties', async () => {
			const html = await fixture.readFile('/server/index.html');
			const $ = cheerio.load(html);
			assert.ok(
				$('#out-dir')
					.text()
					.endsWith('/dist/serializeManifest-when-the-experimental-flag-is-enabled-in/'),
			);
			assert.ok($('#src-dir').text().endsWith('/src/'));
			assert.ok($('#cache-dir').text().endsWith('/.astro/'));
			assert.ok($('#root').text().endsWith('/'));
			assert.ok(
				$('#build-client')
					.text()
					.endsWith('/dist/serializeManifest-when-the-experimental-flag-is-enabled-in/client/'),
			);
			assert.ok(
				$('#build-server')
					.text()
					.endsWith('/dist/serializeManifest-when-the-experimental-flag-is-enabled-in/server/'),
			);
			assert.equal($('#build-assets-prefix').text(), 'https://cdn.example.com');
			// URL
			assert.equal($('#root-url').text(), 'true');
		});
	});

	describe('when the experimental flag is enabled in SSR', async () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-manifest/',
				adapter: testAdapter(),
				output: 'server',
				outDir: './dist/serializeManifest-when-the-experimental-flag-is-enabled-in-ssr/',
			});

			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('should return the expected properties', async () => {
			const request = new Request('http://example.com/blog/server/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			assert.ok(
				$('#out-dir')
					.text()
					.endsWith('/dist/serializeManifest-when-the-experimental-flag-is-enabled-in-ssr/'),
			);
			assert.ok($('#src-dir').text().endsWith('/src/'));
			assert.ok($('#cache-dir').text().endsWith('/.astro/'));
			assert.ok($('#root').text().endsWith('/'));
			assert.ok(
				$('#build-client')
					.text()
					.endsWith('/dist/serializeManifest-when-the-experimental-flag-is-enabled-in-ssr/client/'),
			);
			assert.ok(
				$('#build-server')
					.text()
					.endsWith('/dist/serializeManifest-when-the-experimental-flag-is-enabled-in-ssr/server/'),
			);
			assert.equal($('#build-assets-prefix').text(), 'https://cdn.example.com');
			// URL
			assert.equal($('#root-url').text(), 'true');
		});
	});
});
