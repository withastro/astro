/**
 * UNCOMMENT: Fix "Unexpected "\x00" bug
import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/builtins/' });
  await fixture.build();
});

// TODO: find a way to build one file at-a-time (different fixtures?)
describe('Node builtins', () => {
  it('Can be used with the node: prefix', async () => {
    // node:fs/promise is not supported in Node v12. Test currently throws.
    if (process.versions.node <= '13') {
      return;
    }
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    expect($('#version').text()).to.equal('1.2.0');
    expect($('#dep-version').text()).to.equal('0.0.1');
  });

  it('Throw if using the non-prefixed version', async () => {
    const result = await fixture.readFile('/bare/index.html');
    expect(result.status).to.equal(500);
    expect(result.body).to.include('Use node:fs instead');
  });
});
*/

it.skip('is skipped', () => {});
