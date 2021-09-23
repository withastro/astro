/**
 * UNCOMMENT: fix transform error and "window is not defined" Vite error
import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-dynamic/' });
  await fixture.build();
});

describe('Dynamic components', () => {
  it('Loads client-only packages', async () => {
    const html = await fixture.fetch('/index.html');

    // Grab the react-dom import
    const exp = /import\("(.+?)"\)/g;
    let match, reactRenderer;
    while ((match = exp.exec(html))) {
      if (match[1].includes('renderers/renderer-react/client.js')) {
        reactRenderer = match[1];
      }
    }

    // test 1: React renderer is on the page
    expect(reactRenderer).to.be.ok;

    // test 2: Can load React renderer
    // const result = await fixture.fetch(reactRenderer);
    // expect(result.status).to.equal(200);
  });

  it('Loads pages using client:media hydrator', async () => {
    const html = await fixture.readFile('/media/index.html');

    // test 1: static value rendered
    expect(html).to.include(`value: "(max-width: 700px)"`);

    // test 2: dynamic value rendered
    expect(html).to.include(`value: "(max-width: 600px)"`);
  });

  it('Loads pages using client:only hydrator', async () => {
    const html = await fixture.readFile('/client-only/index.html');
    const $ = cheerio.load(html);

    // test 1: <astro-root> is empty
    expect($('<astro-root>').html()).to.equal('');

    // Grab the svelte import
    const exp = /import\("(.+?)"\)/g;
    let match, svelteRenderer;
    while ((match = exp.exec(result.contents))) {
      if (match[1].includes('renderers/renderer-svelte/client.js')) {
        svelteRenderer = match[1];
      }
    }

    // test 2: Svelte renderer is on the page
    expect(svelteRenderer).to.be.ok;

    // test 3: Can load svelte renderer
    // const result = await fixture.fetch(svelteRenderer);
    // expect(result.status).to.equal(200);
  });
});
*/

it.skip('is skipped', () => {});
