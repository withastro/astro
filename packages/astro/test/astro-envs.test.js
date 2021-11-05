import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Environment Variables', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-envs/' });

    await fixture.build();
  });

  it('builds without throwing', async () => {
    expect(true).to.equal(true);
  });

  it('does render public env, does not render private env', async () => {
    let indexHtml = await fixture.readFile('/index.html');

    expect(indexHtml).to.not.include('CLUB_33');
    expect(indexHtml).to.include('BLUE_BAYOU');
  });
});
