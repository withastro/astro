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

  it('includes public env in client-side JS', async () => {
    let dirs = await fixture.readdir('/assets');
    let found = false;

    // Look in all of the .js files to see if the public env is inlined.
    // Testing this way prevents hardcoding expected js files.
    // If we find it in any of them that's good enough to know its working.
    await Promise.all(
      dirs.map(async (path) => {
        if (path.endsWith('.js')) {
          let js = await fixture.readFile(`/assets/${path}`);
          if (js.includes('BLUE_BAYOU')) {
            found = true;
          }
        }
      })
    );

    expect(found).to.equal(true, 'found the env variable in the JS build');
  });
});
