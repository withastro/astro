import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { loadFixture } from './_test-utils.js';

describe('Prerendered page styles', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender-styles/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
	});

	after(async () => {
		await devServer?.stop();
		await fixture.clean();
	});

	describe('dev', () => {
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		it('includes Tailwind styles in prerendered page', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			// Check that the bg-amber-500 class has its styles included
			assert.ok(html.includes('.bg-amber-500'), 'Expected .bg-amber-500 class to be in the HTML');
		});
	});

	describe('build', () => {
		before(async () => {
			await devServer?.stop();
			devServer = undefined;
			await fixture.build();
		});

		it('includes Tailwind styles in prerendered page', async () => {
			// With cloudflare adapter, prerendered pages are in dist/client/
			const html = await fixture.readFile('/client/index.html');
			// Tailwind CSS is emitted as an external stylesheet linked from the HTML.
			// Verify the HTML references a stylesheet and that the stylesheet contains the expected class.
			assert.ok(html.includes('rel="stylesheet"'), 'Expected the HTML to reference a stylesheet');
			const cssFiles = await fixture.glob('client/_astro/*.css');
			assert.ok(cssFiles.length > 0, 'Expected at least one CSS file in _astro/');
			let foundClass = false;
			for (const cssFile of cssFiles) {
				const css = await fixture.readFile('/' + cssFile);
				if (css.includes('.bg-amber-500')) {
					foundClass = true;
					break;
				}
			}
			assert.ok(foundClass, 'Expected .bg-amber-500 class to be in a generated CSS file');
		});
	});
});

describe('Styles from Astro components imported in MDX content collections', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender-styles/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
	});

	after(async () => {
		await devServer?.stop();
		await fixture.clean();
	});

	describe('dev', () => {
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		it('includes styles from an Astro component imported in an MDX content collection entry', async () => {
			const res = await fixture.fetch('/posts/styled');
			const html = await res.text();
			assert.ok(
				html.includes('.mdx-styled-card'),
				'Expected .mdx-styled-card styles from StyledCard.astro to be injected in the MDX page',
			);
		});
	});

	describe('build', () => {
		before(async () => {
			await devServer?.stop();
			devServer = undefined;
			await fixture.build();
		});

		it('includes styles from an Astro component imported in an MDX content collection entry', async () => {
			const html = await fixture.readFile('/client/posts/styled/index.html');
			assert.ok(
				html.includes('.mdx-styled-card'),
				'Expected .mdx-styled-card styles from StyledCard.astro to be in the built MDX page',
			);
		});
	});
});
