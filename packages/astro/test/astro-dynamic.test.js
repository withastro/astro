import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Dynamic components', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-dynamic/' });
    devServer = await fixture.dev();
  });

  test('Loads client-only packages', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());

    // Grab the react-dom import
    const exp = /import\("(.+?)"\)/g;
    let match, reactRenderer;
    while ((match = exp.exec(html))) {
      if (match[1].includes('renderers/renderer-react/client.js')) {
        reactRenderer = match[1];
      }
    }

    // test 1: React renderer is on the page
    expect(reactRenderer).toBeTruthy();

    // test 2: Can load React renderer
    const result = await fixture.fetch(reactRenderer);
    expect(result.statusCode).toBe(200);
  });

  test('Loads pages using client:media hydrator', async () => {
    const html = await fixture.fetch('/media').then((res) => res.text());

    // test 1: static value rendered
    expect(html).toEqual(expect.stringContaining(`value: "(max-width: 700px)"`));

    // test 2: dynamic value rendered
    expect(html).toEqual(expect.stringContaining(`value: "(max-width: 600px)"`));
  });

  test('Loads pages using client:only hydrator', async () => {
    const html = await fixture.fetch('/client-only').then((res) => res.html());
    const $ = cheerio.load(html);

    // test 1: <astro-root> is empty
    expect($('<astro-root>').html()).toBe('');

    // Grab the svelte import
    const exp = /import\("(.+?)"\)/g;
    let match, svelteRenderer;
    while ((match = exp.exec(result.contents))) {
      if (match[1].includes('renderers/renderer-svelte/client.js')) {
        svelteRenderer = match[1];
      }
    }

    // test 2: Svelte renderer is on the page
    expect(svelteRenderer).toBeTruthy();

    // test 3: Can load svelte renderer
    const result = await fixture.fetch(svelteRenderer);
    expect(result.statusCode).toBe(200);
  });

  test('Can build a project with svelte dynamic components', async () => {
    expect(() => fixture.build()).not.toThrow();
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});
