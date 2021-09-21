/**
 * UNCOMMENT: when "window is not defined" error fixed in Vite
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-client-only/' });
  await fixture.build();
});

// TODO: fix "window is not defined" error in Vite
describe('Client only components', () => {
  test.skip('Loads pages using client:only hydrator', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: <astro-root> is empty
    expect($('astro-root').html()).toBe('');

    // test 2: svelte renderer is on the page
    const exp = /import\("(.+?)"\)/g;
    let match, svelteRenderer;
    while ((match = exp.exec(result.contents))) {
      if (match[1].includes('renderers/renderer-svelte/client.js')) {
        svelteRenderer = match[1];
      }
    }
    expect(svelteRenderer).toBeTruthy();

    // test 3: can load svelte renderer
    // result = await fixture.fetch(svelteRenderer);
    // expect(result.status).toBe(200);
  });
});
*/

test.skip('is skipped', () => {});
