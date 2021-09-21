import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-attrs/' });
  await fixture.build();
});

describe('Attributes', () => {
  test('Passes attributes to elements as expected', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    const attrs = {
      'false-str': 'false',
      'true-str': 'true',
      false: undefined,
      true: 'true',
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
    const html = await fixture.readFile('/component/index.html');
    const $ = cheerio.load(html);

    expect($('#true').attr('attr')).toBe('attr-true');
    expect($('#true').attr('type')).toBe('boolean');
    expect($('#false').attr('attr')).toBe('attr-false');
    expect($('#false').attr('type')).toBe('boolean');
  });

  test('Passes namespaced attributes as expected', async () => {
    const html = await fixture.readFile('/namespaced/index.html');
    const $ = cheerio.load(html);

    expect($('div').attr('xmlns:happy')).toBe('https://example.com/schemas/happy');
    expect($('img').attr('happy:smile')).toBe('sweet');
  });

  test('Passes namespaced attributes to components as expected', async () => {
    const html = await fixture.readFile('/namespaced-component/index.html');
    const $ = cheerio.load(html);

    expect($('span').attr('on:click')).toEqual('(event) => console.log(event)');
  });
});
