import cheerio from 'cheerio';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const CSSBundling = suite('CSS Bundling');

setupBuild(CSSBundling, './fixtures/astro-css-bundling');

// note: the hashes should be deterministic, but updating the file contents will change hashes
// be careful not to test that the HTML simply contains CSS, because it always will! filename and quanity matter here (bundling).
const EXPECTED_CSS = {
  '/index.html': ['/_astro/common-ZVuUT3.css', '/_astro/index-Z2jH7pc.css'],
  '/one/index.html': ['/_astro/common-ZVuUT3.css', '/_astro/one/index-2qFtfN.css'],
  '/two/index.html': ['/_astro/common-ZVuUT3.css', '/_astro/two/index-2jKE68.css'],
};
const UNEXPECTED_CSS = ['/_astro/components/nav.css', '../css/typography.css', '../css/colors.css', '../css/page-index.css', '../css/page-one.css', '../css/page-two.css'];

CSSBundling('Bundles CSS', async (context) => {
  await context.build();

  const builtCSS = new Set();

  // for all HTML files…
  for (const [filepath, css] of Object.entries(EXPECTED_CSS)) {
    const html = await context.readFile(filepath);
    const $ = cheerio.load(html);

    // test 1: assert new bundled CSS is present
    for (const href of css) {
      builtCSS.add(href);
      const link = $(`link[href="${href}"]`);
      assert.equal(link.length, 1);
    }

    // test 2: assert old CSS was removed
    for (const href of UNEXPECTED_CSS) {
      const link = $(`link[href="${href}"]`);
      assert.equal(link.length, 0);
    }
  }

  // test 3: assert all bundled CSS was built and contains CSS
  for (const url of builtCSS.keys()) {
    const css = await context.readFile(url);
    assert.ok(css, true);
  }
});

CSSBundling.run();
