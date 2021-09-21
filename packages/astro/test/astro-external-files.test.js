/**
 * UNCOMMENT: fix Vite error for external files

import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-external-files/' });
  await fixture.build();
});

// TODO: Vite error: fix external files
describe('Externeal file references', () => {
  test('Build with externeal reference', async () => {
    let rss = await fixture.readFile('/index.html');
    expect(rss).toMatchSnapshot();
  });
});
*/

test.skip('is skipped', () => {});
