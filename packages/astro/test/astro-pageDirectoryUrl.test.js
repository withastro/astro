import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('pageUrlFormat', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-page-directory-url',
      buildOptions: {
        pageUrlFormat: 'file',
      },
    });
    await fixture.build();
  });

  it('outputs', async () => {
    expect(await fixture.readFile('/client/index.html')).to.be.ok;
    expect(await fixture.readFile('/nested-md/index.html')).to.be.ok;
    expect(await fixture.readFile('/nested-astro/index.html')).to.be.ok;
  });
});
