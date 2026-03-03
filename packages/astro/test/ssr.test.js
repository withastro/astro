import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { getSharedFixture } from './shared-fixture.js';

/**
 * Consolidated test suite for SSR tests
 * This consolidates multiple smaller SSR test files to reduce total test execution time
 */

async function fetchHTML(fixture, path) {
	const app = await fixture.loadTestAdapterApp();
	const request = new Request('http://example.com' + path);
	const response = await app.render(request);
	const html = await response.text();
	return html;
}

describe('SSR Tests', () => {
	// Tests from ssr-script.test.js
	describe('Scripts in SSR', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;

		describe('Inline scripts', () => {
			describe('without base path', () => {
				before(async () => {
					fixture = await getSharedFixture({
						name: 'ssr-inline-scripts-no-base',
						root: './fixtures/ssr/',
						output: 'server',
						adapter: testAdapter(),
						outDir: './dist/inline-scripts-without-base-path',
					});
				});

				it('scripts get included', async () => {
					const html = await fetchHTML(fixture, '/scripts/inline');
					const $ = cheerioLoad(html);
					assert.equal($('script').length, 1);
				});
			});

			describe('with base path', () => {
				const base = '/hello';

				before(async () => {
					fixture = await getSharedFixture({
						name: 'ssr-inline-scripts-with-base',
						root: './fixtures/ssr/',
						output: 'server',
						adapter: testAdapter(),
						outDir: './dist/inline-scripts-with-base-path',
						base,
					});
				});

				it('Inlined scripts get included without base path in the script', async () => {
					const html = await fetchHTML(fixture, '/hello/scripts/inline');
					const $ = cheerioLoad(html);
					assert.equal($('script').html(), 'console.log("hello world");');
				});
			});
		});

		describe('External scripts', () => {
			describe('without base path', () => {
				let fixture;

				before(async () => {
					fixture = await getSharedFixture({
						name: 'ssr-external-scripts-no-base',
						root: './fixtures/ssr/',
						output: 'server',
						adapter: testAdapter(),
						outDir: './dist/external-scripts-without-base-path',
						vite: {
							build: {
								assetsInlineLimit: 0,
							},
						},
					});
				});

				it('script has correct path', async () => {
					const html = await fetchHTML(fixture, '/scripts/external');
					const $ = cheerioLoad(html);
					assert.match($('script').attr('src'), /^\/_astro\/.*\.js$/);
				});
			});

			describe('with base path', () => {
				let fixture;

				before(async () => {
					fixture = await loadFixture({
						root: './fixtures/ssr/',
						output: 'server',
						adapter: testAdapter(),
						outDir: './dist/external-scripts-with-base-path',
						vite: {
							build: {
								assetsInlineLimit: 0,
							},
						},
						base: '/hello',
					});
				});

				it('script has correct path', async () => {
					const html = await fetchHTML(fixture, '/hello/scripts/external');
					const $ = cheerioLoad(html);
					assert.match($('script').attr('src'), /^\/hello\/_astro\/.*\.js$/);
				});
			});

			describe('with assetsPrefix', () => {
				let fixture;

				before(async () => {
					fixture = await loadFixture({
						root: './fixtures/ssr/',
						output: 'server',
						adapter: testAdapter(),
						outDir: './dist/with-assets-prefix',
						build: {
							assetsPrefix: 'https://cdn.example.com',
						},
						vite: {
							build: {
								assetsInlineLimit: 0,
							},
						},
					});
				});

				it('script has correct path', async () => {
					const html = await fetchHTML(fixture, '/scripts/external');
					const $ = cheerioLoad(html);
					assert.match($('script').attr('src'), /^https:\/\/cdn\.example\.com\/_astro\/.*\.js$/);
				});
			});

			describe('with custom rollup output file names', () => {
				let fixture;

				before(async () => {
					fixture = await loadFixture({
						root: './fixtures/ssr/',
						output: 'server',
						adapter: testAdapter(),
						outDir: './dist/with-rollup-output-file-names',
						vite: {
							build: {
								assetsInlineLimit: 0,
							},
							environments: {
								client: {
									build: {
										rollupOptions: {
											output: {
												entryFileNames: 'assets/entry.[hash].mjs',
												chunkFileNames: 'assets/chunks/chunk.[hash].mjs',
												assetFileNames: 'assets/asset.[hash][extname]',
											},
										},
									},
								},
							},
						},
					});
				});

				it('script has correct path', async () => {
					const html = await fetchHTML(fixture, '/scripts/external');
					const $ = cheerioLoad(html);
					assert.match($('script').attr('src'), /^\/assets\/entry\..{8}\.mjs$/);
				});
			});

			describe('with custom rollup output file names and base', () => {
				let fixture;

				before(async () => {
					fixture = await loadFixture({
						root: './fixtures/ssr/',
						output: 'server',
						adapter: testAdapter(),
						outDir: './dist/with-rollup-output-file-names-and-base',
						vite: {
							build: {
								assetsInlineLimit: 0,
							},
							environments: {
								client: {
									build: {
										rollupOptions: {
											output: {
												entryFileNames: 'assets/entry.[hash].mjs',
												chunkFileNames: 'assets/chunks/chunk.[hash].mjs',
												assetFileNames: 'assets/asset.[hash][extname]',
											},
										},
									},
								},
							},
						},
						base: '/hello',
					});
				});

				it('script has correct path', async () => {
					const html = await fetchHTML(fixture, '/hello/scripts/external');
					const $ = cheerioLoad(html);
					assert.match($('script').attr('src'), /^\/hello\/assets\/entry\..{8}\.mjs$/);
				});
			});

			describe('with custom rollup output file names and assetsPrefix', () => {
				let fixture;

				before(async () => {
					fixture = await loadFixture({
						root: './fixtures/ssr/',
						output: 'server',
						adapter: testAdapter(),
						outDir: './dist/with-rollup-output-file-names-and-assets-prefix',
						build: {
							assetsPrefix: 'https://cdn.example.com',
						},
						vite: {
							build: {
								assetsInlineLimit: 0,
							},
							environments: {
								client: {
									build: {
										rollupOptions: {
											output: {
												entryFileNames: 'assets/entry.[hash].mjs',
												chunkFileNames: 'assets/chunks/chunk.[hash].mjs',
												assetFileNames: 'assets/asset.[hash][extname]',
											},
										},
									},
								},
							},
						},
					});
				});

				it('script has correct path', async () => {
					const html = await fetchHTML(fixture, '/scripts/external');
					const $ = cheerioLoad(html);
					assert.match(
						$('script').attr('src'),
						/^https:\/\/cdn\.example\.com\/assets\/entry\..{8}\.mjs$/,
					);
				});
			});
		});
	});

	// Additional SSR tests can be added here as we consolidate more files
});
