import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('CSS deduplication for hydrated components', () => {
	describe('inlineStylesheets: never', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				site: 'https://test.dev/',
				root: './fixtures/css-deduplication/',
				build: { inlineStylesheets: 'never' },
				outDir: './dist/inline-stylesheets-never',
			});
			await fixture.build();
		});

		it('should not duplicate CSS for hydrated components', async () => {
			const assets = await fixture.readdir('/_astro');

			// Generated file for Counter.css
			const COUNTER_CSS_PATH = '/_astro/index.DbgLc3FE.css';
			let file = await fixture.readFile(COUNTER_CSS_PATH);
			file = file.replace(/\s+/g, '');

			for (const fileName of assets) {
				const filePath = `/_astro/${fileName}`;
				if (filePath === COUNTER_CSS_PATH || !fileName.endsWith('.css')) {
					continue;
				}

				let r = await fixture.readFile(filePath);
				r = r.replace(/\s+/g, '');
				if (file.includes(r)) {
					assert.fail(`Duplicate CSS file: ${fileName}`);
				}
			}
			assert.ok(true);
		});
	});

	describe('inlineStylesheets: always', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				site: 'https://test.dev/',
				root: './fixtures/css-deduplication/',
				build: { inlineStylesheets: 'always' },
				outDir: './dist/inline-stylesheets-always',
			});
			await fixture.build();
		});

		it('should not emit any .css file when inlineStylesheets is always', async () => {
			const assets = await fixture.readdir('/_astro');
			assert.ok(!assets.some((f) => f.endsWith('.css')));
		});

		it('should not duplicate CSS for hydrated components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Get all <style> tag contents
			const styles = [];
			$('style').each((_i, el) => {
				styles.push($(el).text().replace(/\s+/g, ''));
			});

			// Ensure no <style> tag content is duplicated
			const seen = new Set();
			for (const style of styles) {
				if (seen.has(style)) {
					assert.fail('Duplicate <style> tag content found in index.html');
				}
				seen.add(style);
			}
			assert.ok(true);
		});
	});
});
