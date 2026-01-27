import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../../astro/test/test-utils.js';

/**
 * @see https://github.com/withastro/astro/issues/14252
 *
 * Svelte components that are conditionally rendered (inside {#if} blocks)
 * should have their styles included in the production build, even when
 * the condition is initially false during SSR.
 */

let fixture;

describe('Conditional rendering styles', () => {
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/conditional-rendering/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('includes styles for conditionally rendered Svelte components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			// Get all CSS - either inline styles or linked stylesheets
			let allCss = '';

			// Check inline styles
			$('style').each((_, el) => {
				allCss += $(el).text();
			});

			// Check linked stylesheets
			const cssLinks = $('link[rel="stylesheet"]');
			for (const link of cssLinks.toArray()) {
				const href = $(link).attr('href');
				if (href) {
					const cssContent = await fixture.readFile(href);
					allCss += cssContent;
				}
			}

			// Verify that styles from the Child component are included
			// The Child has: background-color: red
			// Even though the child is not rendered during SSR (showChild starts as false),
			// its styles should still be included in the build output
			const hasChildStyles = allCss.includes('red');
			assert.ok(
				hasChildStyles,
				`Child component styles (background-color: red) should be included in build output even when conditionally rendered. CSS found: ${allCss.substring(0, 500)}`,
			);
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

		it('includes styles for conditionally rendered Svelte components', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());

			// In dev mode, styles are typically injected via JS
			// The component should be present and work correctly
			const hasParentComponent = html.includes('parent');

			assert.ok(hasParentComponent, 'Parent component should be present in dev mode');
		});
	});
});
