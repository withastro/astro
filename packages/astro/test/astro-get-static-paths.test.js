import { loadFixture } from './helpers.js';

describe('getStaticPaths()', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-get-static-paths/',
      buildOptions: {
        site: 'https://mysite.dev/blog/',
        sitemap: false,
      },
    });
  });

  test('is only called once during build', async () => {
    // It would throw if this was not true
    expect(() => fixture.build()).not.toThrow();
  });
});
