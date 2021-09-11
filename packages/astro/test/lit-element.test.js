import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('LitElement test', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/lit-element/',
      renderers: ['@astrojs/renderer-lit'],
    });
    devServer = await fixture.dev();
  });

  test('Renders a custom element by tag name', async () => {
    // lit SSR is not currently supported on Node.js < 13
    if (process.versions.node <= '13') {
      return;
    }
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: attributes rendered
    expect($('my-element').attr('foo')).toBe('bar');

    // test 2: shadow rendered
    expect($('my-element').html()).toEqual(expect.stringContaining(`<div>Testing...</div>`));
  });

  // Skipped because not supported by Lit
  test.skip('Renders a custom element by the constructor', async () => {
    const html = await fixture.fetch('/ctr').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: attributes rendered
    expect($('my-element').attr('foo')).toBe('bar');

    // test 2: shadow rendered
    expect($('my-element').html()).toEqual(expect.stringContaining(`<div>Testing...</div>`));
  });

  afterAll(async () => {
    // important: close dev server (free up port and connection)
    await devServer.stop();

    // The Lit renderer adds browser globals that interfere with other tests, so remove them now.
    const globals = Object.keys(globalThis.window || {});
    globals.splice(globals.indexOf('global'), 1);
    for (let name of globals) {
      delete globalThis[name];
    }
  });
});
