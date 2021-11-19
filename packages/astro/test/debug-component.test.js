import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import os from 'os';

// TODO: fix these tests on macOS
const isMacOS = os.platform() === 'darwin';

describe('<Debug />', () => {
  if (isMacOS) return;

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
  });
});