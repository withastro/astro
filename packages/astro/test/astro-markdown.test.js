import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-markdown/',
      renderers: ['@astrojs/renderer-preact'],
      buildOptions: {
        sitemap: false,
      },
    });
  });

  describe('dev', () => {
    let devServer;

    beforeAll(async () => {
      devServer = await fixture.dev();
    });

    test('Can load markdown pages with Astro', async () => {
      const html = await fixture.fetch('/post').then((res) => res.text());
      const $ = cheerio.load(html);

      // test 1: There is a div added in markdown
      expect($('#first').length).toBeTruthy();

      // test 2: There is a div added via a component from markdown
      expect($('#test').length).toBeTruthy();
    });

    test('Can load more complex jsxy stuff', async () => {
      const html = await fixture.fetch('/complex').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('#test').text()).toBe('Hello world');
    });

    test('Empty code blocks do not fail', async () => {
      const html = await fixture.fetch('/empty-code').then((res) => res.text());
      const $ = cheerio.load(html);

      // test 1: There is not a `<code>` in the codeblock
      expect($('pre')[0].children).toHaveLength(1);

      // test 2: The empty `<pre>` failed to render
      expect($('pre')[1].children).toHaveLength(0);
    });

    test('Runs code blocks through syntax highlighter', async () => {
      const html = await fixture.fetch('/code').then((res) => res.text());
      const $ = cheerio.load(html);

      // test 1: There are child spans in code blocks
      expect($('code span').length).toBeGreaterThan(0);
    });

    test('Scoped styles should not break syntax highlight', async () => {
      const html = await fixture.fetch('/scopedStyles-code').then((res) => res.text());
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
      const html = await fixture.fetch('/deep').then((res) => res.text());
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
      const html = await fixture.fetch('/recursive').then((res) => res.text());
      const $ = cheerio.load(html);

      // tests 1–2: Rendered title correctly
      expect($('.a > h1').text()).toBe('A');
      expect($('.b > h1').text()).toBe('B');
      expect($('.c > h1').text()).toBe('C');
    });

    test('Renders dynamic content though the content attribute', async () => {
      const html = await fixture.fetch('/external').then((res) => res.text());
      const $ = cheerio.load(html);

      // test 1: Rendered markdown content
      expect($('#outer')).toHaveLength(1);

      // test 2: Nested markdown content
      expect($('#inner')).toHaveLength(1);

      // test 3: Scoped class passed down
      expect($('#inner').is('[class]')).toBe(true);
    });

    test('Renders curly braces correctly', async () => {
      const html = await fixture.fetch('/braces').then((res) => res.text());
      const $ = cheerio.load(html);

      // test 1: Rendered curly braces markdown content
      expect($('code')).toHaveLength(3);

      // test 2: Rendered curly braces markdown content
      expect($('code:first-child').text()).toBe('({})');

      // test 3: Rendered curly braces markdown content
      expect($('code:nth-child(2)').text()).toBe('{...props}');

      // test 4: Rendered curly braces markdown content
      expect($('code:last-child').text()).toBe('{/* JavaScript */}');
    });

    test('Does not close parent early when using content attribute (#494)', async () => {
      const html = await fixture.fetch('/close').then((res) => res.text());
      const $ = cheerio.load(html);

      // test <Markdown content /> closed div#target early
      expect($('#target').children()).toHaveLength(2);
    });

    test('Can render markdown with --- for horizontal rule', async () => {
      const result = await fixture.fetch('/dash');
      expect(result.statusCode).toBe(200);
    });

    test('Can render markdown content prop (#1259)', async () => {
      const html = await fixture.fetch('/content').then((res) => res.text());
      const $ = cheerio.load(html);

      // test Markdown rendered correctly via content prop
      expect($('h1').text()).toBe('Foo');
    });

    // important: close dev server (free up port and connection)
    afterAll(async () => {
      await devServer.stop();
    });
  });

  describe('build', () => {
    beforeAll(async () => {
      await fixture.build();
    });

    test('Bundles client-side JS for prod', async () => {
      const complexHtml = await fixture.readFile('/complex/index.html');

      // test 1: Counter.js is loaded from page
      expect(complexHtml).toEqual(expect.stringContaining(`import("/_astro/src/components/Counter.js"`));

      // test 2: Counter.jsx is bundled for prod
      const counterJs = await fixture.readFile('/_astro/src/components/Counter.js');
      expect(counterJs).toBeTruthy();
    });
  });
});
