import { loadFixture } from './test-utils.js';

describe('Throw', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-throw/' });
    devServer = await fixture.dev();
  });

  test('Can throw an error from an `.astro` file', async () => {
    const result = await fixture.fetch('/');
    expect(result.statusCode).toBe(500);
  });

  test('Does not complete build when Error is thrown', async () => {
    expect(() => fixture.build()).toThrow();
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});
