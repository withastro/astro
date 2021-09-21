/**
 * UNCOMMENT when Component slots lands in new compiler

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-children/',
    renderers: ['@astrojs/renderer-preact', '@astrojs/renderer-vue', '@astrojs/renderer-svelte'],
  });
  await fixture.build();
});

// TODO: waiting on Component slots
describe('Component children', () => {
  test('Passes string children to framework components', async () => {
    const html = await fixture.readFile('/strings/index.html');
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
    const html = await fixture.readFile('/markup/index.html');
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
    const html = await fixture.readFile('/multiple/index.html');
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
});
*/

test.skip('is skipped', () => {});
