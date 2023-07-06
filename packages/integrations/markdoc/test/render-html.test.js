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

    it('renders content - components interleaved with html', async () => {
      const fixture = await getFixture('render-html');
      const server = await fixture.startDevServer();

      const res = await fixture.fetch('/components');
      const html = await res.text();

      renderComponentsHTMLChecks(html);

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

    it('renders content - components interleaved with html', async () => {
      const fixture = await getFixture('render-html');
      await fixture.build();

      const html = await fixture.readFile('/components/index.html');

      renderComponentsHTMLChecks(html);
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
  expect(aside1SectionP1.textContent).to.equal('I\'m a Markdown paragraph inside an top-level aside tag');
  const aside1H2_1 = aside1Section.querySelector('h2:nth-of-type(1)');
  expect(aside1H2_1.id).to.equal('im-an-h2-via-markdown-markup'); // automatic slug
  expect(aside1H2_1.textContent).to.equal('I\'m an H2 via Markdown markup');
  const aside1H2_2 = aside1Section.querySelector('h2:nth-of-type(2)');
  expect(aside1H2_2.id).to.equal('h-two');
  expect(aside1H2_2.textContent).to.equal('I\'m an H2 via HTML markup');
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
};

/** @param {HTMLElement | null | undefined} el */

function assertInlineMark(el) {
  expect(el).to.not.be.null;
  expect(el).to.not.be.undefined;
  expect(el.children.length).to.equal(0);
  expect(el.textContent).to.equal('inline mark');
  expect(el.className).to.equal('mark');
  expect(el.style.color).to.equal('hotpink');
}

// for reference, here's what the component rendered HTML looks like
/* 
<article>
  <p>This is a <span style="color: hotpink" class="mark">inline mark</span> in regular Markdown markup.</p>
  <p id="p1">This is a <span style="color: hotpink" class="mark">inline mark</span> under some HTML</p>
  <div id="div1">
    <p id="p2">This is a <span style="color: hotpink" class="mark">inline mark</span> under some HTML</p>
    <p id="p3">This is a <span id="p3-span1"><span style="color: hotpink" class="mark">inline mark</span></span> under
      some HTML</p>
  </div>
  <aside class="content tip astro-DUQFCLOB" aria-label="Aside One">
    <p class="title astro-DUQFCLOB" aria-hidden="true">
      <span class="icon astro-DUQFCLOB">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="16" height="16" class="astro-DUQFCLOB">
          <path fill-rule="evenodd"
            d="M14 0a8.8 8.8 0 0 0-6 2.6l-.5.4-.9 1H3.3a1.8 1.8 0 0 0-1.5.8L.1 7.6a.8.8 0 0 0 .4 1.1l3.1 1 .2.1 2.4 2.4.1.2 1 3a.8.8 0 0 0 1 .5l2.9-1.7a1.8 1.8 0 0 0 .8-1.5V9.5l1-1 .4-.4A8.8 8.8 0 0 0 16 2v-.1A1.8 1.8 0 0 0 14.2 0h-.1zm-3.5 10.6-.3.2L8 12.3l.5 1.8 2-1.2a.3.3 0 0 0 .1-.2v-2zM3.7 8.1l1.5-2.3.2-.3h-2a.3.3 0 0 0-.3.1l-1.2 2 1.8.5zm5.2-4.5a7.3 7.3 0 0 1 5.2-2.1h.1a.3.3 0 0 1 .3.3v.1a7.3 7.3 0 0 1-2.1 5.2l-.5.4a15.2 15.2 0 0 1-2.5 2L7.1 11 5 9l1.5-2.3a15.3 15.3 0 0 1 2-2.5l.4-.5zM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-8.4 9.6a1.5 1.5 0 1 0-2.2-2.2 7 7 0 0 0-1.1 3 .2.2 0 0 0 .3.3c.6 0 2.2-.4 3-1.1z"
            class="astro-DUQFCLOB"></path>
        </svg>
      </span>
      Aside One
    </p>
    <section class="astro-DUQFCLOB">
      <p>I&#39;m a Markdown paragraph inside an top-level aside tag</p>
      <h2 id="im-an-h2-via-markdown-markup">I&#39;m an H2 via Markdown markup</h2>
      <h2 id="h-two">I&#39;m an H2 via HTML markup</h2>
      <p><strong>Markdown bold</strong> vs <strong>HTML bold</strong></p>
      <p></p>
    </section>
  </aside>
  <section id="section1">
    <div id="div1">
      <aside class="content tip astro-DUQFCLOB" aria-label="Nested un-indented Aside">
        <p class="title astro-DUQFCLOB" aria-hidden="true">
          <span class="icon astro-DUQFCLOB">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="16" height="16" class="astro-DUQFCLOB">
              <path fill-rule="evenodd"
                d="M14 0a8.8 8.8 0 0 0-6 2.6l-.5.4-.9 1H3.3a1.8 1.8 0 0 0-1.5.8L.1 7.6a.8.8 0 0 0 .4 1.1l3.1 1 .2.1 2.4 2.4.1.2 1 3a.8.8 0 0 0 1 .5l2.9-1.7a1.8 1.8 0 0 0 .8-1.5V9.5l1-1 .4-.4A8.8 8.8 0 0 0 16 2v-.1A1.8 1.8 0 0 0 14.2 0h-.1zm-3.5 10.6-.3.2L8 12.3l.5 1.8 2-1.2a.3.3 0 0 0 .1-.2v-2zM3.7 8.1l1.5-2.3.2-.3h-2a.3.3 0 0 0-.3.1l-1.2 2 1.8.5zm5.2-4.5a7.3 7.3 0 0 1 5.2-2.1h.1a.3.3 0 0 1 .3.3v.1a7.3 7.3 0 0 1-2.1 5.2l-.5.4a15.2 15.2 0 0 1-2.5 2L7.1 11 5 9l1.5-2.3a15.3 15.3 0 0 1 2-2.5l.4-.5zM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-8.4 9.6a1.5 1.5 0 1 0-2.2-2.2 7 7 0 0 0-1.1 3 .2.2 0 0 0 .3.3c.6 0 2.2-.4 3-1.1z"
                class="astro-DUQFCLOB"></path>
            </svg>
          </span>
          Nested un-indented Aside
        </p>
        <section class="astro-DUQFCLOB">
          <p>regular Markdown markup</p>
          <p id="p4">nested <span style="color: hotpink" class="mark">inline mark</span> content</p>
        </section>
      </aside>
    </div>
    <div id="div2">
      <aside class="content tip astro-DUQFCLOB" aria-label="Nested indented Aside">
        <p class="title astro-DUQFCLOB" aria-hidden="true">
          <span class="icon astro-DUQFCLOB">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="16" height="16" class="astro-DUQFCLOB">
              <path fill-rule="evenodd"
                d="M14 0a8.8 8.8 0 0 0-6 2.6l-.5.4-.9 1H3.3a1.8 1.8 0 0 0-1.5.8L.1 7.6a.8.8 0 0 0 .4 1.1l3.1 1 .2.1 2.4 2.4.1.2 1 3a.8.8 0 0 0 1 .5l2.9-1.7a1.8 1.8 0 0 0 .8-1.5V9.5l1-1 .4-.4A8.8 8.8 0 0 0 16 2v-.1A1.8 1.8 0 0 0 14.2 0h-.1zm-3.5 10.6-.3.2L8 12.3l.5 1.8 2-1.2a.3.3 0 0 0 .1-.2v-2zM3.7 8.1l1.5-2.3.2-.3h-2a.3.3 0 0 0-.3.1l-1.2 2 1.8.5zm5.2-4.5a7.3 7.3 0 0 1 5.2-2.1h.1a.3.3 0 0 1 .3.3v.1a7.3 7.3 0 0 1-2.1 5.2l-.5.4a15.2 15.2 0 0 1-2.5 2L7.1 11 5 9l1.5-2.3a15.3 15.3 0 0 1 2-2.5l.4-.5zM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-8.4 9.6a1.5 1.5 0 1 0-2.2-2.2 7 7 0 0 0-1.1 3 .2.2 0 0 0 .3.3c.6 0 2.2-.4 3-1.1z"
                class="astro-DUQFCLOB"></path>
            </svg>
          </span>
          Nested indented Aside
        </p>
        <section class="astro-DUQFCLOB">
          <p>regular Markdown markup</p>
          <p id="p5">nested <span style="color: hotpink" class="mark">inline<span
                id="inception-span">mark</span></span> content</p>
        </section>
      </aside>
    </div>
  </section>
</article>
*/
