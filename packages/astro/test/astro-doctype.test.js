import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Doctype', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-doctype/' });
    devServer = await fixture.dev();
  });

  test('Automatically prepends the standards mode doctype', async () => {
    const html = await fixture.fetch('/prepend').then((res) => res.text());

    // test that Doctype always included
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));
  });

  test('No attributes added when doctype is provided by user', async () => {
    const html = await fixture.fetch('/provided').then((res) => res.text());

    // test that Doctype always included
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));
  });

  test.skip('Preserves user provided doctype', async () => {
    const html = await fixture.fetch('/preserve').then((res) => res.text());

    // test that Doctype included was preserved
    expect(html).toEqual(expect.stringMatching(new RegExp('^<!doctype HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">')));
  });

  test('User provided doctype is case insensitive', async () => {
    const html = await fixture.fetch('/capital').then((res) => res.text());

    // test 1: Doctype left alone
    expect(html).toEqual(expect.stringMatching(/^<!DOCTYPE html>/));

    // test 2: no closing tag
    expect(html).not.toEqual(expect.stringContaining('</!DOCTYPE>'));
  });

  test('Doctype can be provided in a layout', async () => {
    const html = await fixture.fetch('/in-layout').then((res) => res.text());

    // test 1: doctype is at the front
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));

    // test 2: A link inside of the head
    const $ = cheerio.load(html);
    expect($('head link')).toHaveLength(1);
  });

  test('Doctype is added in a layout without one', async () => {
    const html = await fixture.fetch('/in-layout-no-doctype').then((res) => res.text());

    // test that doctype is at the front
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));
  });

  test('Doctype is added in a layout used with markdown pages', async () => {
    const html = await fixture.fetch('/in-layout-article').then((res) => res.text());

    // test 1: doctype is at the front
    expect(html).toEqual(expect.stringMatching(/^<!doctype html>/));

    // test 2: A link inside of the head
    const $ = doc(html);
    expect($('head link')).toHaveLength(1);
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.close();
  });
});
