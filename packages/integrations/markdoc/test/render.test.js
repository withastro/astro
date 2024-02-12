import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

async function getFixture(name) {
	return await loadFixture({
		root: new URL(`./fixtures/${name}/`, import.meta.url),
	});
}

describe('Markdoc - render', () => {
	describe('dev', () => {
		it('renders content - simple', async () => {
			const fixture = await getFixture('render-simple');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderSimpleChecks(html);

			await server.stop();
		});

		it('renders content - with config', async () => {
			const fixture = await getFixture('render-with-config');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderConfigChecks(html);

			await server.stop();
		});

		it('renders content - with components', async () => {
			const fixture = await getFixture('render-with-components');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderComponentsChecks(html);

			await server.stop();
		});

		it('renders content - with indented components', async () => {
			const fixture = await getFixture('render-with-indented-components');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderIndentedComponentsChecks(html);

			await server.stop();
		});

		it('renders content - with `render: null` in document', async () => {
			const fixture = await getFixture('render-null');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderNullChecks(html);

			await server.stop();
		});

		it('renders content - with root folder containing space', async () => {
			const fixture = await getFixture('render with-space');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderWithRootFolderContainingSpace(html);

			await server.stop();
		});
	});

	describe('build', () => {
		it('renders content - simple', async () => {
			const fixture = await getFixture('render-simple');
			await fixture.build();

			const html = await fixture.readFile('/index.html');

			renderSimpleChecks(html);
		});

		it('renders content - with config', async () => {
			const fixture = await getFixture('render-with-config');
			await fixture.build();

			const html = await fixture.readFile('/index.html');

			renderConfigChecks(html);
		});

		it('renders content - with components', async () => {
			const fixture = await getFixture('render-with-components');
			await fixture.build();

			const html = await fixture.readFile('/index.html');

			renderComponentsChecks(html);
		});

		it('renders content - with indented components', async () => {
			const fixture = await getFixture('render-with-indented-components');
			await fixture.build();

			const html = await fixture.readFile('/index.html');

			renderIndentedComponentsChecks(html);
		});

		it('renders content - with `render: null` in document', async () => {
			const fixture = await getFixture('render-null');
			await fixture.build();

			const html = await fixture.readFile('/index.html');

			renderNullChecks(html);
		});

		it('renders content - with root folder containing space', async () => {
			const fixture = await getFixture('render with-space');
			await fixture.build();

			const html = await fixture.readFile('/index.html');

			renderWithRootFolderContainingSpace(html);
		});
	});
});

/**
 * @param {string} html
 */
function renderNullChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	assert.equal(h2.textContent, 'Post with render null');
	assert.equal(h2.parentElement?.tagName, 'BODY');
}

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

/** @param {string} html */
function renderConfigChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	assert.equal(h2.textContent, 'Post with config');
	const textContent = html;

	assert.notEqual(textContent.includes('Hello'), true);
	assert.equal(textContent.includes('Hola'), true);
	assert.equal(textContent.includes('Konnichiwa'), true);

	const runtimeVariable = document.querySelector('#runtime-variable');
	assert.equal(runtimeVariable?.textContent?.trim(), 'working!');
}

/** @param {string} html */
function renderSimpleChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	assert.equal(h2.textContent, 'Simple post');
	const p = document.querySelector('p');
	assert.equal(p.textContent, 'This is a simple Markdoc post.');
}

/** @param {string} html */
function renderWithRootFolderContainingSpace(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	assert.equal(h2.textContent, 'Simple post with root folder containing a space');
	const p = document.querySelector('p');
	assert.equal(p.textContent, 'This is a simple Markdoc post with root folder containing a space.');
}
