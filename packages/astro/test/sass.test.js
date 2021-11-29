import { expect } from 'chai';
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

  it('shows helpful error on failure', async () => {
    const res = await fixture.fetch('/error').then((res) => res.text());
    expect(res).to.include('Undefined variable');
  });
});
