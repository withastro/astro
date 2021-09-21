/**
 * UNCOMMENT: separate this fixture into two

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/builtins/' });
  await fixture.build();
});

// TODO: find a way to build one file at-a-time (different fixtures?)
describe('Node builtins', () => {
  test('Can be used with the node: prefix', async () => {
    // node:fs/promise is not supported in Node v12. Test currently throws.
    if (process.versions.node <= '13') {
      return;
    }
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    expect($('#version').text()).toBe('1.2.0');
    expect($('#dep-version').text()).toBe('0.0.1');
  });

  test('Throw if using the non-prefixed version', async () => {
    const result = await fixture.readFile('/bare/index.html');
    expect(result.status).toBe(500);
    expect(result.body).toEqual(expect.stringContaining('Use node:fs instead'));
  });
});
*/

test.skip('is skipped', () => {});
