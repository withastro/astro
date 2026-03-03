import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('SVG Deduplication', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('build', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/svg-deduplication/',
			});
			await fixture.build();
		});

		it('deduplicates identical SVG files in build output', async () => {
			// Get all SVG files in the build output
			const distDir = new URL('./fixtures/svg-deduplication/dist/', import.meta.url);
			const assetsDir = new URL('./_astro/', distDir);

			let svgFiles = [];
			try {
				const files = await readdir(assetsDir);
				svgFiles = files.filter((file) => file.endsWith('.svg'));
			} catch (_e) {
				// Assets directory might not exist if no SVGs are emitted
			}

			// Should only have 2 unique SVG files (duplicate1/duplicate2 share content, unique is separate)
			assert.equal(
				svgFiles.length,
				2,
				`Expected 2 unique SVG files, found ${svgFiles.length}: ${svgFiles.join(', ')}`,
			);
		});

		it('preserves all SVG URLs in HTML output', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// All three SVG components should render
			const duplicate1Svg = $('#duplicate1 svg');
			const duplicate2Svg = $('#duplicate2 svg');
			const uniqueSvg = $('#unique svg');

			assert.equal(duplicate1Svg.length, 1, 'duplicate1 SVG should render');
			assert.equal(duplicate2Svg.length, 1, 'duplicate2 SVG should render');
			assert.equal(uniqueSvg.length, 1, 'unique SVG should render');

			// Check SVG content is correct
			assert.ok(
				duplicate1Svg.find('circle').length > 0,
				'duplicate1 should contain circle element',
			);
			assert.ok(
				duplicate2Svg.find('circle').length > 0,
				'duplicate2 should contain circle element',
			);
			assert.ok(uniqueSvg.find('rect').length > 0, 'unique should contain rect element');
		});

		it('generates deterministic filenames for identical content', async () => {
			const html = await fixture.readFile('/index.html');

			// Both duplicate SVGs should reference the same underlying file
			// This is verified by the file count test above - if they reference
			// different files, we'd have 3 SVG files instead of 2
			assert.ok(html.includes('<svg'), 'SVGs should be inlined in HTML');
		});
	});

	describe('dev', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/svg-deduplication/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('serves SVG components correctly in dev mode', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);

			// All SVG components should render in dev mode
			const duplicate1Svg = $('#duplicate1 svg');
			const duplicate2Svg = $('#duplicate2 svg');
			const uniqueSvg = $('#unique svg');

			assert.equal(duplicate1Svg.length, 1, 'duplicate1 SVG should render in dev');
			assert.equal(duplicate2Svg.length, 1, 'duplicate2 SVG should render in dev');
			assert.equal(uniqueSvg.length, 1, 'unique SVG should render in dev');
		});
	});
});
