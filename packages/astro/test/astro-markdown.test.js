/**
 * UNCOMMENT: add markdown support

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-markdown/',
    renderers: ['@astrojs/renderer-preact'],
    buildOptions: {
      sitemap: false,
    },
  });
  await fixture.build();
});

describe('Astro Markdown', () => {
  test('Can load markdown pages with Astro', async () => {
    const html = await fixture.readFile('/post/index.html');
    const $ = cheerio.load(html);

    // test 1: There is a div added in markdown
    expect($('#first').length).toBeTruthy();

    // test 2: There is a div added via a component from markdown
    expect($('#test').length).toBeTruthy();
  });

  test('Can load more complex jsxy stuff', async () => {
    const html = await fixture.readFile('/complex/index.html');
    const $ = cheerio.load(html);

    expect($('#test').text()).toBe('Hello world');
  });

  test('Empty code blocks do not fail', async () => {
    const html = await fixture.fetch('/empty-code/index.html');
    const $ = cheerio.load(html);

    // test 1: There is not a `<code>` in the codeblock
    expect($('pre')[0].children).toHaveLength(1);

    // test 2: The empty `<pre>` failed to render
    expect($('pre')[1].children).toHaveLength(0);
  });

  test('Runs code blocks through syntax highlighter', async () => {
    const html = await fixture.readFile('/code/index.html');
    const $ = cheerio.load(html);

    // test 1: There are child spans in code blocks
    expect($('code span').length).toBeGreaterThan(0);
  });

  test('Scoped styles should not break syntax highlight', async () => {
    const html = await fixture.readFile('/scopedStyles-code/index.html');
    const $ = cheerio.load(html);

    // test 1: <pre> tag has scopedStyle class passed down
    expect($('pre').is('[class]')).toBe(true);

    // test 2: <pre> tag has correct language
    expect($('pre').hasClass('language-js')).toBe(true);

    // test 3: <code> tag has correct language
    expect($('code').hasClass('language-js')).toBe(true);

    // test 4: There are child spans in code blocks
    expect($('code span').length).toBeGreaterThan(0);
  });

  test('Renders correctly when deeply nested on a page', async () => {
    const html = await fixture.readFile('/deep/index.html');
    const $ = cheerio.load(html);

    // test 1: Rendered all children
    expect($('#deep').children()).toHaveLength(3);

    // tests 2–4: Only rendered title in each section
    assert.equal($('.a').children()).toHaveLength(1);
    assert.equal($('.b').children()).toHaveLength(1);
    assert.equal($('.c').children()).toHaveLength(1);

    // test 5–7: Rendered title in correct section
    assert.equal($('.a > h2').text()).toBe('A');
    assert.equal($('.b > h2').text()).toBe('B');
    assert.equal($('.c > h2').text()).toBe('C');
  });

  test('Renders recursively', async () => {
    const html = await fixture.readFile('/recursive/index.html');
    const $ = cheerio.load(html);

    // tests 1–2: Rendered title correctly
    expect($('.a > h1').text()).toBe('A');
    expect($('.b > h1').text()).toBe('B');
    expect($('.c > h1').text()).toBe('C');
  });

  test('Renders dynamic content though the content attribute', async () => {
    const html = await fixture.readFile('/external/index.html');
    const $ = cheerio.load(html);

    // test 1: Rendered markdown content
    expect($('#outer')).toHaveLength(1);

    // test 2: Nested markdown content
    expect($('#inner')).toHaveLength(1);

    // test 3: Scoped class passed down
    expect($('#inner').is('[class]')).toBe(true);
  });

  test('Renders curly braces correctly', async () => {
    const html = await fixture.readFile('/braces/index.html');
    const $ = cheerio.load(html);

    // test 1: Rendered curly braces markdown content
    expect($('code')).toHaveLength(3);

    // test 2: Rendered curly braces markdown content
    expect($('code:first-child').text()).toBe('({})');

    // test 3: Rendered curly braces markdown content
    expect($('code:nth-child(2)').text()).toBe('{...props}');

    // test 4: Rendered curly braces markdown content
    expect($('code:last-child').text()).toBe('{/* JavaScript *\/}');
  });

  test('Does not close parent early when using content attribute (#494)', async () => {
    const html = await fixture.readFile('/close/index.html');
    const $ = cheerio.load(html);

    // test <Markdown content /> closed div#target early
    expect($('#target').children()).toHaveLength(2);
  });

  test('Can render markdown with --- for horizontal rule', async () => {
    const result = await fixture.readFile('/dash/index.html');
    expect(result.status).toBe(200);
  });

  test('Can render markdown content prop (#1259)', async () => {
    const html = await fixture.readFile('/content/index.html');
    const $ = cheerio.load(html);

    // test Markdown rendered correctly via content prop
    expect($('h1').text()).toBe('Foo');
  });
});

*/

test.skip('is skipped', () => {});
