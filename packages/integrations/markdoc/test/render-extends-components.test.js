import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const root = new URL('./fixtures/render-with-extends-components/', import.meta.url);

describe('Markdoc - render components defined in `extends`', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root,
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

		it('renders content - with components', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();

			renderComponentsChecks(html);
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('renders content - with components', async () => {
			const html = await fixture.readFile('/index.html');

			renderComponentsChecks(html);
		});
	});
});

/** @param {string} html */
function renderComponentsChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	assert.equal(h2.textContent, 'Post with components');

	// Renders custom shortcode component
	const marquee = document.querySelector('marquee');
	assert.notEqual(marquee, null);
	assert.equal(marquee.hasAttribute('data-custom-marquee'), true);

	// Renders Astro Code component
	const pre = document.querySelector('pre');
	assert.notEqual(pre, null);
	assert.equal(pre.className, 'astro-code github-dark');

	// Renders 2nd Astro Code component inside if tag
	const pre2 = document.querySelectorAll('pre')[1];
	assert.notEqual(pre2, null);
	assert.equal(pre2.className, 'astro-code github-dark');
}
