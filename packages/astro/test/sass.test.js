import { expect } from 'chai';
import os from 'os';
import { loadFixture } from './test-utils.js';

// note: many Sass tests live in 0-css.test.js to test within context of a framework.
// these tests are independent of framework.
describe('Sass', () => {
  let fixture;
  let devServer;

  before(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/sass/' });
    devServer = await fixture.startDevServer();
  });

  after(async () => {
    devServer && (await devServer.stop());
  });

  // TODO: Sass cannot be found on macOS for some reason... Vite issue?
  const test = os.platform() === 'darwin' ? it.skip : it;
  test('shows helpful error on failure', async () => {
    const res = await fixture.fetch('/error').then((res) => res.text());
    expect(res).to.include('Undefined variable');
  });
});
