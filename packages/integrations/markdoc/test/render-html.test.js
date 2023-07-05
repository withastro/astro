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

			const res = await fixture.fetch('/simple');
			const html = await res.text();

			renderSimpleChecks(html);

			await server.stop();
		});
    
		it('renders content - nested-html', async () => {
			const fixture = await getFixture('render-html');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/nested-html');
			const html = await res.text();

			renderNestedHTMLChecks(html);

			await server.stop();
		});

	});

	describe('build', () => {
		it('renders content - simple', async () => {
			const fixture = await getFixture('render-html');
			await fixture.build();

			const html = await fixture.readFile('/simple/index.html');

			renderSimpleChecks(html);
		});

		it('renders content - nested-html', async () => {
			const fixture = await getFixture('render-html');
			await fixture.build();

			const html = await fixture.readFile('/nested-html/index.html');

			renderNestedHTMLChecks(html);
		});

	});
});

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

/** @param {string} html */
function renderNestedHTMLChecks(html) {
	const { document } = parseHTML(html);

  const p = document.querySelector('p');
  expect(p.textContent).to.equal('before inner after');
  expect(p.children.length).to.equal(1);

  const pSpan1 = p.querySelector('span');
  expect(pSpan1.textContent).to.equal('inner');
  expect(pSpan1.id).to.equal('inner1');
  expect(pSpan1.className).to.equal('inner-class');
  expect(pSpan1.style.color).to.equal('hotpink');

}
