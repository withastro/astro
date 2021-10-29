import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-markdown/',
      renderers: ['@astrojs/renderer-preact'],
      buildOptions: {
        sitemap: false,
      },
    });
    await fixture.build();
  });

  it('Can load markdown pages with Astro', async () => {
    const html = await fixture.readFile('/post/index.html');
    const $ = cheerio.load(html);

    // test 1: There is a div added in markdown
    expect($('#first').length).to.be.ok;

    // test 2: There is a div added via a component from markdown
    expect($('#test').length).to.be.ok;
  });

  it('Can load more complex jsxy stuff', async () => {
    const html = await fixture.readFile('/complex/index.html');
    const $ = cheerio.load(html);

    expect($('#test').text()).to.equal('Hello world');
  });

  it('Empty code blocks do not fail', async () => {
    const html = await fixture.readFile('/empty-code/index.html');
    const $ = cheerio.load(html);

    // test 1: There is not a `<code>` in the codeblock
    expect($('pre')[0].children).to.have.lengthOf(1);

    // test 2: The empty `<pre>` failed to render
    expect($('pre')[1].children).to.have.lengthOf(0);
  });

  it('Runs code blocks through syntax highlighter', async () => {
    const html = await fixture.readFile('/code/index.html');
    const $ = cheerio.load(html);

    // test 1: There are child spans in code blocks
    expect($('code span').length).greaterThan(0);
  });

  it('Scoped styles should not break syntax highlight', async () => {
    const html = await fixture.readFile('/scopedStyles-code/index.html');
    const $ = cheerio.load(html);

    // test 1: <pre> tag has scopedStyle class passed down
    expect($('pre').is('[class]')).to.equal(true);
    expect($('pre').attr('class').split(' ').length).to.equal(2)

    // test 2: <pre> tag has correct language
    expect($('pre').hasClass('language-js')).to.equal(true);

    // test 3: <code> tag has correct language
    expect($('code').hasClass('language-js')).to.equal(true);

    // test 4: There are child spans in code blocks
    expect($('code span').length).to.be.greaterThan(0);
  });

  it('Renders correctly when deeply nested on a page', async () => {
    const html = await fixture.readFile('/deep/index.html');
    const $ = cheerio.load(html);

    // test 1: Rendered all children
    expect($('#deep').children()).to.have.lengthOf(3);

    // tests 2–4: Only rendered title in each section
    expect($('.a').children()).to.have.lengthOf(1);
    expect($('.b').children()).to.have.lengthOf(1);
    expect($('.c').children()).to.have.lengthOf(1);

    // test 5–7: Rendered title in correct section
    expect($('.a > h2').text()).to.equal('A');
    expect($('.b > h2').text()).to.equal('B');
    expect($('.c > h2').text()).to.equal('C');
  });

  it('Renders dynamic content though the content attribute', async () => {
    const html = await fixture.readFile('/external/index.html');
    const $ = cheerio.load(html);

    // test 1: Rendered markdown content
    expect($('#outer')).to.have.lengthOf(1);

    // test 2: Nested markdown content
    expect($('#inner')).to.have.lengthOf(1);

    // test 3: Scoped class passed down
    expect($('#inner').is('[class]')).to.equal(true);
  });

  it('Renders curly braces correctly', async () => {
    const html = await fixture.readFile('/braces/index.html');
    const $ = cheerio.load(html);

    // test 1: Rendered curly braces markdown content
    expect($('code')).to.have.lengthOf(3);

    // test 2: Rendered curly braces markdown content
    expect($('code:first-child').text()).to.equal('({})');

    // test 3: Rendered curly braces markdown content
    expect($('code:nth-child(2)').text()).to.equal('{...props}');

    // test 4: Rendered curly braces markdown content
    expect($('code:last-child').text()).to.equal('{/* JavaScript *\/}');
  });

  it('Does not close parent early when using content attribute (#494)', async () => {
    const html = await fixture.readFile('/close/index.html');
    const $ = cheerio.load(html);

    // test <Markdown content /> closed div#target early
    expect($('#target').children()).to.have.lengthOf(2);
  });

  it('Can render markdown with --- for horizontal rule', async () => {
    const html = await fixture.readFile('/dash/index.html');
    expect(!!html).to.equal(true);
  });

  it('Can render markdown content prop (#1259)', async () => {
    const html = await fixture.readFile('/content/index.html');
    const $ = cheerio.load(html);

    // test Markdown rendered correctly via content prop
    expect($('h1').text()).to.equal('Foo');
  });
});