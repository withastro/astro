/**
 * UNCOMMENT: fix layout bug

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-doctype/' });
  await fixture.build();
});


describe('Doctype', () => {
  test('Automatically prepends the standards mode doctype', async () => {
    const html = await fixture.readFile('/prepend/index.html');

    // test that Doctype always included
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));
  });

  test('No attributes added when doctype is provided by user', async () => {
    const html = await fixture.readFile('/provided/index.html');

    // test that Doctype always included
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));
  });

  test('Preserves user provided doctype', async () => {
    const html = await fixture.readFile('/preserve/index.html');

    // test that Doctype included was preserved
    expect(html).toEqual(expect.stringMatching(new RegExp('^<!doctype HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">')));
  });

  test('User provided doctype is case insensitive', async () => {
    const html = await fixture.readFile('/capital/index.html');

    // test 1: Doctype left alone
    expect(html).toEqual(expect.stringMatching(/^<!DOCTYPE html>/));

    // test 2: no closing tag
    expect(html).not.toEqual(expect.stringContaining('</!DOCTYPE>'));
  });

  test('Doctype can be provided in a layout', async () => {
    const html = await fixture.readFile('/in-layout/index.html');

    // test 1: doctype is at the front
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));

    // test 2: A link inside of the head
    const $ = cheerio.load(html);
    expect($('head link')).toHaveLength(1);
  });

  test('Doctype is added in a layout without one', async () => {
    const html = await fixture.readFile('/in-layout-no-doctype/index.html');

    // test that doctype is at the front
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));
  });

  test('Doctype is added in a layout used with markdown pages', async () => {
    const html = await fixture.readFile('/in-layout-article/index.html');

    // test 1: doctype is at the front
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));

    // test 2: A link inside of the head
    const $ = cheerio.load(html);
    expect($('head link')).toHaveLength(1);
  });
});
*/

test.skip('is skipped', () => {});
