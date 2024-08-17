import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('astro:ssr-manifest, split', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let entryPoints;
	let currentRoutes;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-split-manifest/',
			output: 'server',
			adapter: testAdapter({
				setEntryPoints(entries) {
					if (entries) {
						entryPoints = entries;
					}
				},
				setRoutes(routes) {
					currentRoutes = routes;
				},
				extendAdapter: {
					adapterFeatures: {
						functionPerRoute: true,
					},
				},
			}),
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('should be able to render a specific entry point', async () => {
		const pagePath = 'src/pages/index.astro';
		const app = await fixture.loadEntryPoint(pagePath, currentRoutes);
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();

		const $ = cheerio.load(html);
		assert.match(
			$('#assets').text(),
			/\["\/_astro\/index\.([\w-]{8})\.css","\/prerender\/index\.html"\]/,
		);
	});

	it('should give access to entry points that exists on file system', async () => {
		// number of the pages inside src/
		assert.equal(entryPoints.size, 6);
		for (const fileUrl of entryPoints.values()) {
			let filePath = fileURLToPath(fileUrl);
			assert.equal(existsSync(filePath), true);
		}
	});

	it('should correctly emit the the pre render page', async () => {
		const indexUrl = new URL(
			'./fixtures/ssr-split-manifest/dist/client/prerender/index.html',
			import.meta.url,
		);
		const text = readFileSync(indexUrl, {
			encoding: 'utf8',
		});
		assert.equal(text.includes('<title>Pre render me</title>'), true);
	});

	it('should emit an entry point to request the pre-rendered page', async () => {
		const pagePath = 'src/pages/prerender.astro';
		const app = await fixture.loadEntryPoint(pagePath, currentRoutes);
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		assert.equal(html.includes('<title>Pre render me</title>'), true);
	});

	describe('when function per route is enabled', async () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-split-manifest/',
				output: 'server',
				adapter: testAdapter({
					setEntryPoints(entries) {
						if (entries) {
							entryPoints = entries;
						}
					},
					setRoutes(routes) {
						currentRoutes = routes;
					},
					extendAdapter: {
						adapterFeatures: {
							functionPerRoute: true,
						},
					},
				}),
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
			});
			await fixture.build();
		});
		it('should correctly build, and not create a "uses" entry point', async () => {
			const pagePath = 'src/pages/index.astro';
			const app = await fixture.loadEntryPoint(pagePath, currentRoutes);
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			assert.equal(html.includes('<title>Testing</title>'), true);
		});
	});
});
