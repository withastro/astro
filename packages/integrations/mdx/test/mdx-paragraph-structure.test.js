import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX Paragraph Structure', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-paragraph-structure/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('should preserve paragraph structure with nested spans and line breaks', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			
			// The content should be in a single paragraph, not split into multiple paragraphs
			const paragraphs = $('p');
			
			// Should have only one paragraph containing the full text
			assert.equal(paragraphs.length, 1);
			
			const paragraphHtml = paragraphs.first().html();
			
			// Should contain the nested spans
			assert.match(paragraphHtml, /<span><span>amet<\/span><\/span>/);
			
			// Should contain both parts of the text in the same paragraph
			assert.match(paragraphHtml, /Lorem ipsum/);
			assert.match(paragraphHtml, /consectetur/);
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should preserve paragraph structure in dev mode', async () => {
			const response = await fixture.fetch('/');
			const html = await response.text();
			const $ = cheerio.load(html);
			
			const paragraphs = $('p');
			
			// Should have only one paragraph containing the full text
			assert.equal(paragraphs.length, 1);
			
			const paragraphHtml = paragraphs.first().html();
			
			// Should contain the nested spans
			assert.match(paragraphHtml, /<span><span>amet<\/span><\/span>/);
			
			// Should contain both parts of the text in the same paragraph
			assert.match(paragraphHtml, /Lorem ipsum/);
			assert.match(paragraphHtml, /consectetur/);
		});
	});
});