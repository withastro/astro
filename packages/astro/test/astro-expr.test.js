/**
 * UNCOMMENT: @astrojs/compiler transform error

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-expr/',
    renderers: ['@astrojs/renderer-preact'],
  });
  await fixture.build();
});

describe('Expressions', () => {
  test('Can load page', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    for (let col of ['red', 'yellow', 'blue']) {
      expect($('#' + col)).toHaveLength(1);
    }
  });

  test('Ignores characters inside of strings', async () => {
    const html = await fixture.readFile('/strings/index.html');
    const $ = cheerio.load(html);

    for (let col of ['red', 'yellow', 'blue']) {
      expect($('#' + col)).toHaveLength(1);
    }
  });

  test('Ignores characters inside of line comments', async () => {
    const html = await fixture.readFile('/line-comments/index.html');
    const $ = cheerio.load(html);

    for (let col of ['red', 'yellow', 'blue']) {
      expect($('#' + col)).toHaveLength(1);
    }
  });

  test('Ignores characters inside of multiline comments', async () => {
    const html = await fixture.readFile('/multiline-comments/index.html');
    const $ = cheerio.load(html);

    for (let col of ['red', 'yellow', 'blue']) {
      expect($('#' + col)).toHaveLength(1);
    }
  });

  test('Allows multiple JSX children in mustache', async () => {
    const html = await fixture.readFile('/multiple-children/index.html');

    expect(html).toEqual(expect.stringContaining('#f'));
    expect(html).not.toEqual(expect.stringContaining('#t'));
  });

  test('Allows <> Fragments in expressions', async () => {
    const html = await fixture.readFile('/multiple-children/index.html');
    const $ = cheerio.load(html);

    expect($('#fragment').children()).toHaveLength(3);
    expect($('#fragment').children('#a')).toHaveLength(1);
    expect($('#fragment').children('#b')).toHaveLength(1);
    expect($('#fragment').children('#c')).toHaveLength(1);
  });

  test('Does not render falsy values using &&', async () => {
    const html = await fixture.readFile('/falsy/index.html');
    const $ = cheerio.load(html);

    // test 1: Expected {true && <span id="true" />} to render
    expect($('#true')).toHaveLength(1);

    // test 2: Expected {0 && "VALUE"} to render "0"
    expect($('#zero').text()).toBe('0');

    // test 3: Expected {false && <span id="false" />} not to render
    expect($('#false')).toHaveLength(0);

    // test 4: Expected {null && <span id="null" />} not to render
    expect($('#null')).toHaveLength(0);

    // test 5: Expected {undefined && <span id="undefined" />} not to render
    expect($('#undefined')).toHaveLength(0);

    // Inside of a component

    // test 6: Expected {true && <span id="true" />} to render
    expect($('#frag-true')).toHaveLength(1);

    // test 7: Expected {false && <span id="false" />} not to render
    expect($('#frag-false')).toHaveLength(0);

    // test 8: Expected {null && <span id="null" />} not to render
    expect($('#frag-null')).toHaveLength(0);

    // test 9: Expected {undefined && <span id="undefined" />} not to render
    expect($('#frag-undefined')).toHaveLength(0);
  });
});
*/

test.skip('is skipped', () => {});
