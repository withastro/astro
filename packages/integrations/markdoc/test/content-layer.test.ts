import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

const root = new URL('./fixtures/content-layer/', import.meta.url);

describe('Markdoc - Content Layer', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root,
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

		it('renders content - with components inside partials', async () => {
			const html = await fixture.readFile('/index.html');

			renderComponentsInsidePartialsChecks(html);
		});
	});
});

function renderComponentsChecks(html: string) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	assert.equal(h2!.textContent, 'Post with components');

	// Renders custom shortcode component
	const marquee = document.querySelector('marquee');
	assert.notEqual(marquee, null);
	assert.equal(marquee!.hasAttribute('data-custom-marquee'), true);

	// Renders Astro Code component
	const pre = document.querySelector('pre');
	assert.notEqual(pre, null);
	assert.ok(pre!.classList.contains('github-dark'));
	assert.ok(pre!.classList.contains('astro-code'));
}

function renderComponentsInsidePartialsChecks(html: string) {
	const { document } = parseHTML(html);
	// renders Counter.tsx
	const button = document.querySelector('#counter');
	assert.equal(button!.textContent, '1');

	// renders DeeplyNested.astro
	const deeplyNested = document.querySelector('#deeply-nested');
	assert.equal(deeplyNested!.textContent, 'Deeply nested partial');
}
