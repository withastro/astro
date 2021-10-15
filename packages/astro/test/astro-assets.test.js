/**
 * UNCOMMENT: add support for automatic <img> and srcset in build
import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-assets/' });
  await fixture.build();
});

// TODO: add automatic asset bundling
describe('Assets', () => {
  it('built the base image', async () => {
    await fixture.readFile('/images/twitter.png');
  });

  it('built the 2x image', async () => {
    await fixture.readFile('/images/twitter@2x.png');
  });

  it('built the 3x image', async () => {
    await fixture.readFile('/images/twitter@3x.png');
  });
});
*/

it.skip('is skipped', () => {});
