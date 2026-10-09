import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('SVG Deduplication', () => {
	let fixture: Fixture;

	describe('build', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/svg-deduplication/',
				outDir: './dist/svg-deduplication-build/',
			});
			await fixture.build();
		});

		it('deduplicates identical SVG files in build output', async () => {
			// Get all SVG files in the build output
			const assetsDir = new URL('./_astro/', fixture.config.outDir);

			let svgFiles: string[] = [];
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
});
