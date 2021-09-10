import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Node builtins with polyfillNode option', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/builtins-polyfillnode/' });
  });

  test('Doesn’t alias to node: prefix', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    expect($('#url').text()).toBe('unicorn.jpg');
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});
