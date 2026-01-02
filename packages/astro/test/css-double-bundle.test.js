import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('CSS Double Bundling Prevention', function () {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-double-bundle/',
		});
		await fixture.build();
	});

	it('CSS imported in both page frontmatter and component script should only be bundled once', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// Get all CSS content (both inline and linked)
		let allCss = '';

		// Check inline styles
		$('style').each((_, el) => {
			allCss += $(el).html();
		});

		// Check linked stylesheets
		const cssLinks = $('link[rel="stylesheet"][href^="/_astro/"]');
		for (let i = 0; i < cssLinks.length; i++) {
			const href = cssLinks.eq(i).attr('href');
			const cssContent = await fixture.readFile(href.replace(/^\//, '/'));
			allCss += cssContent;
		}

		// Count occurrences of the CSS rule - should appear exactly once
		const matches = allCss.match(/button\s*\{[^}]*background:\s*purple/g) || [];

		assert.equal(
			matches.length,
			1,
			`Expected CSS rule "button{background:purple}" to appear exactly once, but found ${matches.length} occurrences. CSS should not be double-bundled when imported from both page frontmatter and component script.`,
		);
	});

	it('CSS should still be present in the build output', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// Should have either inline styles or linked stylesheet
		const hasInlineStyle = $('style').length > 0;
		const hasLinkedStylesheet = $('link[rel="stylesheet"]').length > 0;

		assert.ok(
			hasInlineStyle || hasLinkedStylesheet,
			'Expected CSS to be present in the build output (either inline or as a linked stylesheet)',
		);
	});
});
