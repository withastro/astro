import cheerio from 'cheerio';
import path from 'path';
import { loadFixture } from './test-utils.js';

describe('Hoisted scripts', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-scripts/' });
  });

  describe('dev', () => {
    let devServer;

    beforeAll(async () => {
      devServer = await fixture.dev();
    });

    test('Moves external scripts up', async () => {
      const html = await fixture.fetch('/external').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('head script[type="module"][data-astro="hoist"]')).toHaveLength(2);
      expect($('body script')).toHaveLength(0);
    });

    test('Moves inline scripts up', async () => {
      const html = await fixture.fetch('/inline').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('head script[type="module"][data-astro="hoist"]')).toHaveLength(1);
      expect($('body script')).toHaveLength(0);
    });

    // important: close dev server (free up port and connection)
    afterAll(async () => {
      await devServer.stop();
    });
  });

  describe('build', () => {
    beforeAll(async () => {
      await fixture.build();
    });

    test('Inline page builds the scripts to a single bundle', async () => {
      /* Inline page */
      let inline = await fixture.readFile('/inline/index.html');
      let $ = cheerio.load(inline);

      // test 1: Just one entry module
      assert.equal($('script')).toHaveLength(1);

      // test 2: attr removed
      expect($('script').attr('data-astro')).toBe(undefined);

      let entryURL = path.join('inline', $('script').attr('src'));
      let inlineEntryJS = await fixture.readFile(entryURL);

      // test 3: the JS exists
      expect(inlineEntryJS).toBeTruthy();
    });

    test('External page builds the scripts to a single bundle', async () => {
      let external = await fixture.readFile('/external/index.html');
      $ = cheerio.load(external);

      // test 1: there are two scripts
      assert.equal($('script')).toHaveLength(2);

      let el = $('script').get(1);
      entryURL = path.join('external', $(el).attr('src'));
      let externalEntryJS = await readFile(entryURL);

      // test 2: the JS exists
      expect(externalEntryJS).toBeTruthy();
    });
  });
});
