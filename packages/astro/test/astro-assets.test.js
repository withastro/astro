import { loadFixture } from './test-utils';

let fixture;

describe('Assets', () => {
  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-assets/' });
    await fixture.build();
  });

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
