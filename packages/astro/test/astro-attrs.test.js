import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;
let devServer;

describe('Attributes', () => {
  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-attrs/' });
    devServer = await fixture.dev();
  });

  test('Passes attributes to elements as expected', async () => {
    const html = await fixture.fetch('/').then((res) => res.html());
    const $ = cheerio.load(html);

    const attrs = {
      'false-str': 'false',
      'true-str': 'true',
      false: undefined,
      true: '',
      empty: '',
      null: undefined,
      undefined: undefined,
    };

    for (const [k, v] of Object.entries(attrs)) {
      const attr = $(`#${k}`).attr('attr');
      expect(attr).toBe(v);
    }
  });

  test('Passes boolean attributes to components as expected', async () => {
    const html = await fixture.fetch('/component').then((res) => res.text());
    const $ = cheerio.load(html);

    expect($('#true').attr('attr')).toBe('attr-true');
    expect($('#true').attr('type')).toBe('boolean');
    expect($('#false').attr('attr')).toBe('attr-false');
    expect($('#false').attr('type')).toBe('boolean');
  });

  test('Passes namespaced attributes as expected', async () => {
    const html = await fixture.fetch('/namespaced').then((res) => res.text());
    const $ = cheerio.load(result.contents);

    expect($('div').attr('xmlns:happy')).toBe('https://example.com/schemas/happy');
    expect($('img').attr('happy:smile')).toBe('sweet');
  });

  test('Passes namespaced attributes to components as expected', async () => {
    const html = await fixture.fetch('/namespaced-component');
    const $ = cheerio.load(html);

    expect($('span').attr('on:click')).toEqual(Function.prototype.toString.call((event) => console.log(event)));
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.close();
  });
});
