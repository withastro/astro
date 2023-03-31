import { parseHTML } from 'linkedom';
import { expect } from 'chai';
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

		it('renders content - with `render: null` in document', async () => {
			const fixture = await getFixture('render-null');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderNullChecks(html);

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

		it('renders content - with `render: null` in document', async () => {
			const fixture = await getFixture('render-null');
			await fixture.build();

			const html = await fixture.readFile('/index.html');

			renderNullChecks(html);
		});
	});
});

/**
 * @param {string} html
 */
function renderNullChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	expect(h2.textContent).to.equal('Post with render null');
	expect(h2.parentElement?.tagName).to.equal('BODY');
}

/** @param {string} html */
function renderComponentsChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	expect(h2.textContent).to.equal('Post with components');

	// Renders custom shortcode component
	const marquee = document.querySelector('marquee');
	expect(marquee).to.not.be.null;
	expect(marquee.hasAttribute('data-custom-marquee')).to.equal(true);

	// Renders Astro Code component
	const pre = document.querySelector('pre');
	expect(pre).to.not.be.null;
	expect(pre.className).to.equal('astro-code');
}

/** @param {string} html */
function renderConfigChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	expect(h2.textContent).to.equal('Post with config');
	const textContent = html;

	expect(textContent).to.not.include('Hello');
	expect(textContent).to.include('Hola');
	expect(textContent).to.include(`Konnichiwa`);

	const runtimeVariable = document.querySelector('#runtime-variable');
	expect(runtimeVariable?.textContent?.trim()).to.equal('working!');
}

/** @param {string} html */
function renderSimpleChecks(html) {
	const { document } = parseHTML(html);
	const h2 = document.querySelector('h2');
	expect(h2.textContent).to.equal('Simple post');
	const p = document.querySelector('p');
	expect(p.textContent).to.equal('This is a simple Markdoc post.');
}
