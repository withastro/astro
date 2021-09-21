/**
 * UNCOMMENT: add support for automatic <img> and srcset in build

import { loadFixture } from './test-utils';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-assets/' });
  await fixture.build();
});

// TODO: add automatic asset bundling
describe('Assets', () => {
  test('built the base image', async () => {
    await fixture.readFile('/images/twitter.png');
  });

  test('built the 2x image', async () => {
    await fixture.readFile('/images/twitter@2x.png');
  });

  test('built the 3x image', async () => {
    await fixture.readFile('/images/twitter@3x.png');
  });
});
*/

test.skip('is skipped', () => {});
