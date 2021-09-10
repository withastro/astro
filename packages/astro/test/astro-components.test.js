import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Components tests', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-components/' });
    devServer = await fixture.dev();
  });

  test('Astro components are able to render framework components', async () => {
    const html = await fixture.fetch('/').then((res) => res.html());
    const $ = cheerio.load(html);

    // test 1: Renders Astro component
    const $astro = $('#astro');
    expect($astro.children()).toHaveLength(3);

    // test 2: Renders React component
    const $react = $('#react');
    expect($react).not.toHaveLength(0);

    // test 3: Renders Vue component
    const $vue = $('#vue');
    expect($vue).not.toHaveLength(0);

    // test 4: Renders Svelte component
    const $svelte = $('#svelte');
    expect($svelte).not.toHaveLength(0);
  });

  test('Allows Components defined in frontmatter', async () => {
    const html = await fixture.fetch('/frontmatter-component').then((res) => res.text());
    const $ = cheerio.load(html);

    expect($('h1')).toHaveLength(1);
  });

  test('Still throws an error for undefined components', async () => {
    const result = await fixture.fetch('/undefined-component');
    expect(result.statusCode).toBe(500);
  });

  test('Client attrs not added', async () => {
    const html = await fixture.fetch('/client').then((res) => res.text());
    expect(html).not.toEqual(expect.stringMatching(/"client:load": true/));
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.close();
  });
});
