/**
 * UNCOMMENT: fix top-level expressions in components
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-component-code/' });
  await fixture.build();
});

describe('<Code', () => {
  test('<Code> without lang or theme', async () => {
    let html = await fixture.readFile('/no-lang/index.html');
    const $ = cheerio.load(html);
    expect($('pre')).toHaveLength(1);
    expect($('pre').attr('style')).toBe('background-color: #0d1117; overflow-x: auto;', 'applies default and overflow');
    expect($('pre > code')).toHaveLength(1);

    // test: contains some generated spans
    expect($('pre > code span').length).toBeGreaterThan(1);
  });

  test('<Code lang="...">', async () => {
    let html = await fixture.readFile('/basic/index.html');
    const $ = cheerio.load(html);
    expect($('pre')).toHaveLength(1);
    expect($('pre').attr('class'), 'astro-code');
    expect($('pre > code')).toHaveLength(1);
    // test: contains many generated spans
    expect($('pre > code span').length).toBeGreaterThanOrEqual(6);
  });

  test('<Code theme="...">', async () => {
    let html = await fixture.readFile('/custom-theme/index.html');
    const $ = cheerio.load(html);
    expect($('pre')).toHaveLength(1);
    expect($('pre').attr('class')).toBe('astro-code');
    expect($('pre').attr('style')).toBe('background-color: #2e3440ff; overflow-x: auto;', 'applies custom theme');
  });

  test('<Code wrap>', async () => {
    {
      let html = await fixture.readFile('/wrap-true/index.html');
      const $ = cheerio.load(html);
      expect($('pre')).toHaveLength(1);
      // test: applies wrap overflow
      expect($('pre').attr('style')).toBe('background-color: #0d1117; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;');
    }
    {
      let html = await fixture.readFile('/wrap-false/index.html');
      const $ = cheerio.load(html);
      expect($('pre')).toHaveLength(1);
      // test: applies wrap overflow
      expect($('pre').attr('style')).toBe('background-color: #0d1117; overflow-x: auto;');
    }
    {
      let html = await fixture.readFile('/wrap-null/index.html');
      const $ = cheerio.load(html);
      expect($('pre')).toHaveLength(1);
      // test: applies wrap overflow
      expect($('pre').attr('style')).toBe('background-color: #0d1117');
    }
  });

  test('<Code lang="..." theme="css-variables">', async () => {
    let html = await fixture.readFile('/css-theme/index.html');
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
});
*/

test.skip('is skipped', () => {});
