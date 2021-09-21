/**
 * UNCOMMENT: add Astro slot support

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-slots/' });
  await fixture.build();
});

describe('Slots', () => {
  test('Basic named slots work', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    expect($('#a').text()).toBe('A');
    expect($('#b').text()).toBe('B');
    expect($('#c').text()).toBe('C');
    expect($('#default').text()).toBe('Default');
  });

  test('Dynamic named slots work', async () => {
    const html = await fixture.readFile('/dynamic/index.html');
    const $ = cheerio.load(html);

    expect($('#a').text()).toBe('A');
    expect($('#b').text()).toBe('B');
    expect($('#c').text()).toBe('C');
    expect($('#default').text()).toBe('Default');
  });

  test('Slots render fallback content by default', async () => {
    const html = await fixture.fetch('/fallback/index.html');
    const $ = cheerio.load(html);

    expect($('#default')).toHaveLength(1);
  });

  test('Slots override fallback content', async () => {
    const html = await fixture.readFile('/fallback-override/index.html');
    const $ = cheerio.load(html);

    expect($('#override')).toHaveLength(1);
  });

  test('Slots work with multiple elements', async () => {
    const html = await fixture.readFile('/multiple/index.html');
    const $ = cheerio.load(html);

    expect($('#a').text()).toBe('ABC');
  });

  test('Slots work on Components', async () => {
    const html = await fixture.readFile('/component/index.html');
    const $ = cheerio.load(html);

    // test 1: #a renders
    expect($('#a')).toHaveLength(1);

    // test 2: Slotted component into #a
    expect($('#a').children('astro-component')).toHaveLength(1);

    // test 3: Slotted component into default slot
    expect($('#default').children('astro-component')).toHaveLength(1);
  });

  test('Slots API work on Components', async () => {
    // IDs will exist whether the slots are filled or not
    {
      const html = await fixture.readFile('/slottedapi-default/index.html');
      const $ = cheerio.load(html);

      expect($('#a')).toHaveLength(1);
      expect($('#b')).toHaveLength(1);
      expect($('#c')).toHaveLength(1);
      expect($('#default')).toHaveLength(1);
    }

    // IDs will not exist because the slots are not filled
    {
      const html = await fixture.readFile('/slottedapi-empty/index.html');
      const $ = cheerio.load(html);

      expect($('#a')).toHaveLength(0);
      expect($('#b')).toHaveLength(0);
      expect($('#c')).toHaveLength(0);
      expect($('#default')).toHaveLength(0);
    }

    // IDs will exist because the slots are filled
    {
      const html = await fixture.fetch('/slottedapi-filled/index.html');
      const $ = cheerio.load(html);

      expect($('#a')).toHaveLength(1);
      expect($('#b')).toHaveLength(1);
      expect($('#c')).toHaveLength(1);

      expect($('#default')).toHaveLength(0); // the default slot is not filled
    }

    // Default ID will exist because the default slot is filled
    {
      const html = await fixture.fetch('/slottedapi-default-filled/index.html');
      const $ = cheerio.load(html);

      expect($('#a')).toHaveLength(0);
      expect($('#b')).toHaveLength(0);
      expect($('#c')).toHaveLength(0);

      expect($('#default')).toHaveLength(1); // the default slot is filled
    }
  });
});
*/

test.skip('is skipped', () => {});
