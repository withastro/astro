import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('<Debug />', () => {
  /** @type {import('./test-utils').Fixture} */
  let fixture
  /** @type {import('./test-utils').DevServer} */
  let devServer;

  before(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/debug-component/' });
    devServer = await fixture.startDevServer();
  });

  after(async () => {
    devServer && await devServer.stop();
  });

  it('Works in markdown pages', async () => {
    const response = await fixture.fetch('/posts/first');
    expect(response.status).to.equal(200);
  })
});