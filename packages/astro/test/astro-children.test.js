import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Component children', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-children/',
      renderers: ['@astrojs/renderer-preact', '@astrojs/renderer-vue', '@astrojs/renderer-svelte'],
    });
    devServer = await fixture.dev();
  });

  test('Passes string children to framework components', async () => {
    const html = await fixture.fetch('/strings').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Can pass text to Preact components
    const $preact = $('#preact');
    expect($preact.text().trim()).toBe('Hello world');

    // test 2: Can pass text to Vue components
    const $vue = $('#vue');
    expect($vue.text().trim()).toBe('Hello world');

    // test 3: Can pass text to Svelte components
    const $svelte = $('#svelte');
    expect($svelte.text().trim()).toBe('Hello world');
  });

  test('Passes markup children to framework components', async () => {
    const html = await fixture.fetch('/markup').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Can pass markup to Preact components
    const $preact = $('#preact h1');
    expect($preact.text().trim()).toBe('Hello world');

    // test 2: Can pass markup to Vue components
    const $vue = $('#vue h1');
    expect($vue.text().trim()).toBe('Hello world');

    // test 3: Can pass markup to Svelte components
    const $svelte = $('#svelte h1');
    expect($svelte.text().trim()).toBe('Hello world');
  });

  test('Passes multiple children to framework components', async () => {
    const html = await fixture.fetch('/multiple').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Can pass multiple children to Preact components
    const $preact = $('#preact');
    expect($preact.children()).toHaveLength(2);
    expect($preact.children(':first-child').text().trim()).toBe('Hello world');
    expect($preact.children(':last-child').text().trim()).toBe('Goodbye world');

    // test 2: Can pass multiple children to Vue components
    const $vue = $('#vue');
    expect($vue.children()).toHaveLength(2);
    expect($vue.children(':first-child').text().trim()).toBe('Hello world');
    expect($vue.children(':last-child').text().trim()).toBe('Goodbye world');

    // test 3: Can pass multiple children to Svelte components
    const $svelte = $('#svelte');
    expect($svelte.children()).toHaveLength(2);
    expect($svelte.children(':first-child').text().trim()).toBe('Hello world');
    expect($svelte.children(':last-child').text().trim()).toBe('Goodbye world');
  });

  test('Can build a project with component children', async () => {
    expect(() => fixture.build()).not.toThrow();
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.close();
  });
});
