import { parseHTML } from 'linkedom';
import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

async function getFixture(name) {
	return await loadFixture({
		root: new URL(`./fixtures/${name}/`, import.meta.url),
	});
}

describe('Markdoc - render html', () => {
	let fixture;

	before(async () => {
		fixture = await getFixture('render-html');
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('renders content - simple', async () => {
			const res = await fixture.fetch('/simple');
			const html = await res.text();

			renderSimpleChecks(html);
		});

		it('renders content - nested-html', async () => {
			const res = await fixture.fetch('/nested-html');
			const html = await res.text();

			renderNestedHTMLChecks(html);
		});

		it('renders content - components interleaved with html', async () => {
			const res = await fixture.fetch('/components');
			const html = await res.text();

			renderComponentsHTMLChecks(html);
		});

		it('renders content - randomly cased html attributes', async () => {
			const res = await fixture.fetch('/randomly-cased-html-attributes');
			const html = await res.text();

			renderRandomlyCasedHTMLAttributesChecks(html);
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('renders content - simple', async () => {
			const html = await fixture.readFile('/simple/index.html');

			renderSimpleChecks(html);
		});

		it('renders content - nested-html', async () => {
			const html = await fixture.readFile('/nested-html/index.html');

			renderNestedHTMLChecks(html);
		});

		it('renders content - components interleaved with html', async () => {
			const html = await fixture.readFile('/components/index.html');

			renderComponentsHTMLChecks(html);
		});

		it('renders content - randomly cased html attributes', async () => {
			const html = await fixture.readFile('/randomly-cased-html-attributes/index.html');

			renderRandomlyCasedHTMLAttributesChecks(html);
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

/**
 *
 * @param {string} html */
function renderRandomlyCasedHTMLAttributesChecks(html) {
	const { document } = parseHTML(html);

	const td1 = document.querySelector('#td1');
	const td2 = document.querySelector('#td1');
	const td3 = document.querySelector('#td1');
	const td4 = document.querySelector('#td1');

	// all four <td>'s which had randomly cased variants of colspan/rowspan should all be rendered lowercased at this point

	expect(td1.getAttribute('colspan')).to.equal('3');
	expect(td1.getAttribute('rowspan')).to.equal('2');

	expect(td2.getAttribute('colspan')).to.equal('3');
	expect(td2.getAttribute('rowspan')).to.equal('2');

	expect(td3.getAttribute('colspan')).to.equal('3');
	expect(td3.getAttribute('rowspan')).to.equal('2');

	expect(td4.getAttribute('colspan')).to.equal('3');
	expect(td4.getAttribute('rowspan')).to.equal('2');
}

/**
 * Asserts that the rendered HTML tags with interleaved Markdoc tags (both block and inline) rendered in the expected nested graph of elemements
 *
 * @param {string} html */
function renderComponentsHTMLChecks(html) {
	const { document } = parseHTML(html);

	const naturalP1 = document.querySelector('article > p:nth-of-type(1)');
	expect(naturalP1.textContent).to.equal('This is a inline mark in regular Markdown markup.');
	expect(naturalP1.children.length).to.equal(1);

	const p1 = document.querySelector('article > p:nth-of-type(2)');
	expect(p1.id).to.equal('p1');
	expect(p1.textContent).to.equal('This is a inline mark under some HTML');
	expect(p1.children.length).to.equal(1);
	assertInlineMark(p1.children[0]);

	const div1p1 = document.querySelector('article > #div1 > p:nth-of-type(1)');
	expect(div1p1.id).to.equal('div1-p1');
	expect(div1p1.textContent).to.equal('This is a inline mark under some HTML');
	expect(div1p1.children.length).to.equal(1);
	assertInlineMark(div1p1.children[0]);

	const div1p2 = document.querySelector('article > #div1 > p:nth-of-type(2)');
	expect(div1p2.id).to.equal('div1-p2');
	expect(div1p2.textContent).to.equal('This is a inline mark under some HTML');
	expect(div1p2.children.length).to.equal(1);

	const div1p2span1 = div1p2.querySelector('span');
	expect(div1p2span1.id).to.equal('div1-p2-span1');
	expect(div1p2span1.textContent).to.equal('inline mark');
	expect(div1p2span1.children.length).to.equal(1);
	assertInlineMark(div1p2span1.children[0]);

	const aside1 = document.querySelector('article > aside:nth-of-type(1)');
	const aside1Title = aside1.querySelector('p.title');
	expect(aside1Title.textContent.trim()).to.equal('Aside One');
	const aside1Section = aside1.querySelector('section');
	const aside1SectionP1 = aside1Section.querySelector('p:nth-of-type(1)');
	expect(aside1SectionP1.textContent).to.equal(
		"I'm a Markdown paragraph inside an top-level aside tag"
	);
	const aside1H2_1 = aside1Section.querySelector('h2:nth-of-type(1)');
	expect(aside1H2_1.id).to.equal('im-an-h2-via-markdown-markup'); // automatic slug
	expect(aside1H2_1.textContent).to.equal("I'm an H2 via Markdown markup");
	const aside1H2_2 = aside1Section.querySelector('h2:nth-of-type(2)');
	expect(aside1H2_2.id).to.equal('h-two');
	expect(aside1H2_2.textContent).to.equal("I'm an H2 via HTML markup");
	const aside1SectionP2 = aside1Section.querySelector('p:nth-of-type(2)');
	expect(aside1SectionP2.textContent).to.equal('Markdown bold vs HTML bold');
	expect(aside1SectionP2.children.length).to.equal(2);
	const aside1SectionP2Strong1 = aside1SectionP2.querySelector('strong:nth-of-type(1)');
	expect(aside1SectionP2Strong1.textContent).to.equal('Markdown bold');
	const aside1SectionP2Strong2 = aside1SectionP2.querySelector('strong:nth-of-type(2)');
	expect(aside1SectionP2Strong2.textContent).to.equal('HTML bold');

	const article = document.querySelector('article');
	expect(article.textContent).to.contain('RENDERED');
	expect(article.textContent).to.not.contain('NOT RENDERED');

	const section1 = document.querySelector('article > #section1');
	const section1div1 = section1.querySelector('#div1');
	const section1Aside1 = section1div1.querySelector('aside:nth-of-type(1)');
	const section1Aside1Title = section1Aside1.querySelector('p.title');
	expect(section1Aside1Title.textContent.trim()).to.equal('Nested un-indented Aside');
	const section1Aside1Section = section1Aside1.querySelector('section');
	const section1Aside1SectionP1 = section1Aside1Section.querySelector('p:nth-of-type(1)');
	expect(section1Aside1SectionP1.textContent).to.equal('regular Markdown markup');
	const section1Aside1SectionP4 = section1Aside1Section.querySelector('p:nth-of-type(2)');
	expect(section1Aside1SectionP4.textContent).to.equal('nested inline mark content');
	expect(section1Aside1SectionP4.children.length).to.equal(1);
	assertInlineMark(section1Aside1SectionP4.children[0]);

	const section1div2 = section1.querySelector('#div2');
	const section1Aside2 = section1div2.querySelector('aside:nth-of-type(1)');
	const section1Aside2Title = section1Aside2.querySelector('p.title');
	expect(section1Aside2Title.textContent.trim()).to.equal('Nested indented Aside 💀');
	const section1Aside2Section = section1Aside2.querySelector('section');
	const section1Aside2SectionP1 = section1Aside2Section.querySelector('p:nth-of-type(1)');
	expect(section1Aside2SectionP1.textContent).to.equal('regular Markdown markup');
	const section1Aside1SectionP5 = section1Aside2Section.querySelector('p:nth-of-type(2)');
	expect(section1Aside1SectionP5.id).to.equal('p5');
	expect(section1Aside1SectionP5.children.length).to.equal(1);
	const section1Aside1SectionP5Span1 = section1Aside1SectionP5.children[0];
	expect(section1Aside1SectionP5Span1.textContent).to.equal('inline mark');
	expect(section1Aside1SectionP5Span1.children.length).to.equal(1);
	const section1Aside1SectionP5Span1Span1 = section1Aside1SectionP5Span1.children[0];
	expect(section1Aside1SectionP5Span1Span1.textContent).to.equal(' mark');
}

/** @param {HTMLElement | null | undefined} el */

function assertInlineMark(el) {
	expect(el).to.not.be.null;
	expect(el).to.not.be.undefined;
	expect(el.children.length).to.equal(0);
	expect(el.textContent).to.equal('inline mark');
	expect(el.className).to.equal('mark');
	expect(el.style.color).to.equal('hotpink');
}
