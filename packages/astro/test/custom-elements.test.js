import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Custom Elements', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/custom-elements/',
      renderers: ['@astrojs/test-custom-element-renderer'],
    });
    devServer = await fixture.dev();
  });

  test('Work as constructors', async () => {
    const html = await fixture.fetch('/ctr').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Element rendered
    expect($('my-element')).toHaveLength(1);

    // test 2: shadow rendererd
    expect($('my-element template[shadowroot=open]')).toHaveLength(1);
  });

  test('Works with exported tagName', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Element rendered
    expect($('my-element')).toHaveLength(1);

    // test 2: shadow rendered
    expect($('my-element template[shadowroot=open]')).toHaveLength(1);
  });

  test('Hydration works with exported tagName', async () => {
    const html = await fixture.fetch('/load').then((res) => res.text());
    const $ = cheerio.load(html);

    // SSR
    // test 1: Element rendered
    expect($('my-element')).toHaveLength(1);

    // test 2: shadow rendered
    expect($('my-element template[shadowroot=open]')).toHaveLength(1);

    // Hydration
    // test 3: Component URL is included
    expect(html).toEqual(expect.stringContaining('/src/components/my-element.js'));
  });

  test('Polyfills are added before the hydration script', async () => {
    const html = await fixture.fetch('/load').then((res) => res.text());
    const $ = cheerio.load(html);

    expect($('script[type=module]')).toHaveLength(2);
    expect($('script[type=module]').attr('src')).toBe('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/polyfill.js');
    expect($($('script[type=module]').get(1)).html()).toEqual(
      expect.stringContaining('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/hydration-polyfill.js')
    );
  });

  test('Polyfills are added even if not hydrating', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    expect($('script[type=module]')).toHaveLength(1);
    expect($('script[type=module]').attr('src')).toBe('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/polyfill.js');
    expect($($('script[type=module]').get(1)).html()).not.toEqual(
      expect.stringContaining('/_snowpack/link/packages/astro/test/fixtures/custom-elements/my-component-lib/hydration-polyfill.js')
    );
  });

  test('Custom elements not claimed by renderer are rendered as regular HTML', async () => {
    const html = await fixture.fetch('/nossr').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Rendered the client-only element
    expect($('client-element')).toHaveLength(1);
  });

  test('Can import a client-only element that is nested in JSX', async () => {
    const html = await fixture.fetch('/nested').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Element rendered
    expect($('client-only-element')).toHaveLength(1);
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});
