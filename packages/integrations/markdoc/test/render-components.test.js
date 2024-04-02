import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

async function getFixture(name) {
	return await loadFixture({
		root: new URL(`./fixtures/${name}/`, import.meta.url),
	});
}

describe('Markdoc - render components', () => {
	describe('dev', () => {
		let componentsFixture;
		let componentsServer;

		before(async () => {
			componentsFixture = await getFixture('render-with-components');
			componentsServer = await componentsFixture.startDevServer();
		});

		after(async () => {
			await componentsServer.stop();
		});

		it('renders content - with components', async () => {
			const res = await componentsFixture.fetch('/');
			const html = await res.text();

			renderComponentsChecks(html);
		});

		it('renders content - with components inside partials', async () => {
			const res = await componentsFixture.fetch('/');
			const html = await res.text();

			renderComponentsInsidePartialsChecks(html);
		});

		it('renders content - with indented components', async () => {
			const fixture = await getFixture('render-with-indented-components');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderIndentedComponentsChecks(html);

			await server.stop();
		});
	});

	describe('build', () => {
		let componentsServer;

		before(async () => {
			componentsServer = await getFixture('render-with-components');
		});

		before(async () => {
			await componentsServer.build();
		});

		it('renders content - with components', async () => {
			const html = await componentsServer.readFile('/index.html');

			renderComponentsChecks(html);
		});

		it('renders content - with components inside partials', async () => {
			const html = await componentsServer.readFile('/index.html');

			renderComponentsInsidePartialsChecks(html);
		});

		it('renders content - with indented components', async () => {
			const fixture = await getFixture('render-with-indented-components');
			const html = await fixture.readFile('/index.html');

			renderIndentedComponentsChecks(html);
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
}

/** @param {string} html */
function renderComponentsInsidePartialsChecks(html) {
	console.log('html', html);
	const { document } = parseHTML(html);
	// renders Counter.tsx
	const button = document.querySelector('#counter');
	assert.equal(button.textContent, '1');

	// renders DeeplyNested.astro
	const deeplyNested = document.querySelector('#deeply-nested');
	assert.equal(deeplyNested.textContent, 'Deeply nested partial');
}

/** @param {string} html */
function renderIndentedComponentsChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	assert.equal(h2.textContent, 'Post with indented components');

	// Renders custom shortcode components
	const marquees = document.querySelectorAll('marquee');
	assert.equal(marquees.length, 2);

	// Renders h3
	const h3 = document.querySelector('h3');
	assert.equal(h3.textContent, 'I am an h3!');

	// Renders Astro Code component
	const pre = document.querySelector('pre');
	assert.notEqual(pre, null);
	assert.equal(pre.className, 'astro-code github-dark');
}
