import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Node builtins', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/builtins/' });
    devServer = await fixture.dev();
  });

  test('Can be used with the node: prefix', async () => {
    // node:fs/promise is not supported in Node v12. Test currently throws.
    if (process.versions.node <= '13') {
      return;
    }
    const result = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    expect($('#version').text()).toBe('1.2.0');
    expect($('#dep-version').text()).toBe('0.0.1');
  });

  test('Throw if using the non-prefixed version', async () => {
    const result = await fixture.fetch('/bare');
    expect(result.statusCode).toBe(500);
    expect(result.body).toEqual(expect.stringContaining('Use node:fs instead'));
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});
