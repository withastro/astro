import { loadFixture } from './test-utils.js';

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

describe('pageUrlFormat', () => {
  test('outputs', async () => {
    expect(await fixture.readFile('/client/index.html')).toBeTruthy();
    expect(await fixture.readFile('/nested-md/index.html')).toBeTruthy();
    expect(await fixture.readFile('/nested-astro/index.html')).toBeTruthy();
  });
});
