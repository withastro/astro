import { parseHTML } from 'linkedom';
import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

async function getFixture(name) {
	return await loadFixture({
		root: new URL(`./fixtures/${name}/`, import.meta.url),
	});
}

describe('Markdoc - render html', () => {
	describe('dev', () => {
    
		it('renders content - simple', async () => {
			const fixture = await getFixture('render-html');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();

			renderSimpleChecks(html);

			await server.stop();
		});

	});

	describe('build', () => {
		it('renders content - simple', async () => {
			const fixture = await getFixture('render-html');
			await fixture.build();

			const html = await fixture.readFile('/index.html');

			renderSimpleChecks(html);
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
	expect(pre.className).to.equal('astro-code github-dark');
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
  expect(h2.textContent).to.equal('Simple post header');

  const spanInsideH2 = document.querySelector('h2 > span');
  expect(spanInsideH2.textContent).to.equal('post');
  expect(spanInsideH2.className).to.equal('inside-h2');
  expect(spanInsideH2.style.color).to.equal('fuscia');
  
  const p1 = document.querySelector('article > p:nth-of-type(1)');
  expect(p1.children.length).to.equal(1);
  expect(p1.textContent).to.equal('This is a simple Markdoc post.');
  
  const p2 = document.querySelector('article > p:nth-of-type(2)');
  expect(p2.children.length).to.equal(0);
  expect(p2.textContent).to.equal('This is a paragraph!');
  
  const p3 = document.querySelector('article > p:nth-of-type(3)');
  expect(p3.children.length).to.equal(1);
  expect(p3.textContent).to.equal('This is a span inside a paragraph!');

}
