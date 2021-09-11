import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('<Code', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-component-code' });
    devServer = await fixture.dev();
  });

  test('<Code> without lang or theme', async () => {
    let html = await fixture.fetch('/no-lang');
    const $ = cheerio.load(html);
    expect($('pre')).toHaveLength(1);
    expect($('pre').attr('style')).toBe('background-color: #0d1117; overflow-x: auto;', 'applies default and overflow');
    expect($('pre > code')).toHaveLength(1);

    // test: contains some generated spans
    expect($('pre > code span').length).toBeGreaterThan(1);
  });

  test('<Code lang="...">', async () => {
    let html = await fixture.fetch('/basic');
    const $ = cheerio.load(html);
    expect($('pre')).toHaveLength(1);
    expect($('pre').attr('class'), 'astro-code');
    expect($('pre > code')).toHaveLength(1);
    // test: contains many generated spans
    expect($('pre > code span').length).toBeGreaterThanOrEqual(6);
  });

  test('<Code theme="...">', async () => {
    let html = await fixture.fetch('/custom-theme');
    const $ = cheerio.load(html);
    expect($('pre')).toHaveLength(1);
    expect($('pre').attr('class')).toBe('astro-code');
    expect($('pre').attr('style')).toBe('background-color: #2e3440ff; overflow-x: auto;', 'applies custom theme');
  });

  test('<Code wrap>', async () => {
    {
      let html = await fixture.fetch('/wrap-true');
      const $ = cheerio.load(html);
      expect($('pre')).toHaveLength(1);
      // test: applies wrap overflow
      expect($('pre').attr('style')).toBe('background-color: #0d1117; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;');
    }
    {
      let html = await fixture.fetch('/wrap-false');
      const $ = cheerio.load(html);
      expect($('pre')).toHaveLength(1);
      // test: applies wrap overflow
      expect($('pre').attr('style')).toBe('background-color: #0d1117; overflow-x: auto;');
    }
    {
      let html = await fixture.fetch('/wrap-null');
      const $ = cheerio.load(html);
      expect($('pre')).toHaveLength(1);
      // test: applies wrap overflow
      expect($('pre').attr('style')).toBe('background-color: #0d1117');
    }
  });

  test('<Code lang="..." theme="css-variables">', async () => {
    let html = await fixture.fetch('/css-theme');
    const $ = cheerio.load(html);
    expect($('pre')).toHaveLength(1);
    expect($('pre').attr('class')).toBe('astro-code');
    expect(
      $('pre, pre span')
        .map((i, f) => (f.attribs ? f.attribs.style : 'no style found'))
        .toArray()
    ).toEqual([
      'background-color: var(--astro-code-color-background); overflow-x: auto;',
      'color: var(--astro-code-token-constant)',
      'color: var(--astro-code-token-function)',
      'color: var(--astro-code-color-text)',
      'color: var(--astro-code-token-string-expression)',
      'color: var(--astro-code-color-text)',
    ]);
  });

  afterAll(async () => {
    await devServer.close();
  });
});
