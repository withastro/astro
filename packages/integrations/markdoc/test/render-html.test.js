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

  const p1 = document.querySelector('p:nth-of-type(1)');
  expect(p1.id).to.equal('p1');
  expect(p1.textContent).to.equal('before inner after');
  expect(p1.children.length).to.equal(1);

  const p1Span1 = p1.querySelector('span');
  expect(p1Span1.textContent).to.equal('inner');
  expect(p1Span1.id).to.equal('inner1');
  expect(p1Span1.className).to.equal('inner-class');
  expect(p1Span1.style.color).to.equal('hotpink');

  const p2 = document.querySelector('p:nth-of-type(2)');
  expect(p2.id).to.equal('p2');
  expect(p2.textContent).to.equal('\n  before\n  inner\n  after\n');
  expect(p2.children.length).to.equal(1);

  const divL1 = document.querySelector('div:nth-of-type(1)');
  expect(divL1.id).to.equal('div-l1');
  expect(divL1.children.length).to.equal(2);

  const divL2_1 = divL1.querySelector('div:nth-of-type(1)');
  expect(divL2_1.id).to.equal('div-l2-1');
  expect(divL2_1.children.length).to.equal(1);

  const p3 = divL2_1.querySelector('p:nth-of-type(1)');
  expect(p3.id).to.equal('p3');
  expect(p3.textContent).to.equal('before inner after');
  expect(p3.children.length).to.equal(1);

  const divL2_2 = divL1.querySelector('div:nth-of-type(2)');
  expect(divL2_2.id).to.equal('div-l2-2');
  expect(divL2_2.children.length).to.equal(2);

  const p4 = divL2_2.querySelector('p:nth-of-type(1)');
  expect(p4.id).to.equal('p4');
  expect(p4.textContent).to.equal('before inner after');
  expect(p4.children.length).to.equal(1);

  const p5 = divL2_2.querySelector('p:nth-of-type(2)');
  expect(p5.id).to.equal('p5');
  expect(p5.textContent).to.equal('before inner after');
  expect(p5.children.length).to.equal(1);

}
