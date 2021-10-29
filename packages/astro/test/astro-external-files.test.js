/**
 * UNCOMMENT: add support for smarter "external" scripts in Rollup
import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-external-files/' });
  await fixture.build();
});

// TODO: Vite error: fix external files
describe('Externeal file references', () => {
  it('Build with externeal reference', async () => {
    let rss = await fixture.readFile('/index.html');
    expect(rss).to.be(''); // TODO: inline snapshot
  });
});
*/

it.skip('is skipped', () => {});
