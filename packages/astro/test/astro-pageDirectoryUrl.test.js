import { loadFixture } from './test-utils.js';

describe('pageUrlFormat', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-page-directory-url',
      buildOptions: {
        pageUrlFormat: 'file',
      },
    });

    await fixture.build();
  });

  test('outputs', async () => {
    expect(await fixture.readFile('/client.html')).toBeTruthy();
    expect(await fixture.readFile('/nested-md.html')).toBeTruthy();
    expect(await fixture.readFile('/nested-astro.html')).toBeTruthy();
  });
});
