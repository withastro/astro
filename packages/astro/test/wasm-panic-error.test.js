import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/wasm-panic-error' });
});

describe('compiler error', () => {
  it('throws helpful error', async () => {
    try {
      await fixture.build();

      // should err
      expect(true).to.be.false;
    } catch (err) {
      // test err thrown contains filepath
      expect(err.stack).to.include('wasm-panic-error/src/pages/index.astro');

      // test err thrown contains "unrecoverable error"
      expect(err.message || err.toString()).to.include('Uh oh, the Astro compiler encountered an unrecoverable error!');
    }
  });
});
