import cheerio from 'cheerio';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const CSSBundling = suite('CSS Bundling');

setupBuild(CSSBundling, './fixtures/astro-css-bundling');

// note: the hashes should be deterministic, but updating the file contents will change hashes
// be careful not to test that the HTML simply contains CSS, because it always will! filename and quanity matter here (bundling).
const EXPECTED_CSS = {
  '/index.html': ['/_astro/common-', '/_astro/index-'], // don’t match hashes, which change based on content
  '/one/index.html': ['/_astro/common-', '/_astro/one/index-'],
  '/two/index.html': ['/_astro/common-', '/_astro/two/index-'],
  '/preload/index.html': ['/_astro/common-', '/_astro/preload/index-'],
  '/preload-merge/index.html': ['/_astro/preload-merge/index-']
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
      const link = $(`link[rel="stylesheet"][href^="${href}"]`);
      assert.equal(link.length, 1, 'New bundled CSS is not present');
      builtCSS.add(link.attr('href'));
    }

    // test 2: assert old CSS was removed
    for (const href of UNEXPECTED_CSS) {
      const link = $(`link[rel="stylesheet"][href="${href}"]`);
      assert.equal(link.length, 0, 'Old CSS was not removed');
    }

    // test 3: preload tags was not removed and attributes was preserved
    if (filepath === '/preload/index.html') {
      const stylesheet = $('link[rel="stylesheet"][href^="/_astro/preload/index-"]');
      const preload = $('link[rel="preload"][href^="/_astro/preload/index-"]');
      assert.equal(stylesheet[0].attribs.media, 'print', 'Attribute was not preserved');
      assert.equal(preload.length, 1, 'Preload tag was removed');
    }

    // test 4: preload tags was not removed and attributes was preserved
    if (filepath === '/preload-merge/index.html') {
      const preload = $('link[rel="preload"]');
      assert.equal(preload.length, 1, 'Preload tag was not merged or was removed completly');
    }
  }

  // test 5: assert all bundled CSS was built and contains CSS
  for (const url of builtCSS.keys()) {
    const css = await context.readFile(url);
    assert.ok(css, true);
  }

  // test 6: assert ordering is preserved (typography.css before colors.css)
  const bundledLoc = [...builtCSS].find((k) => k.startsWith('/_astro/common-'));
  const bundledContents = await context.readFile(bundledLoc);
  const typographyIndex = bundledContents.indexOf('body{');
  const colorsIndex = bundledContents.indexOf(':root{');
  assert.ok(typographyIndex < colorsIndex);

  // test 7: assert multiple style blocks were bundled (Nav.astro includes 2 scoped style blocks)
  const scopedNavStyles = [...bundledContents.matchAll('.nav.astro-')];
  assert.is(scopedNavStyles.length, 2);

  // test 8: assert <style global> was not scoped (in Nav.astro)
  const globalStyles = [...bundledContents.matchAll('html{')];
  assert.is(globalStyles.length, 1);

  // test 9: assert keyframes are only scoped for non-global styles (from Nav.astro)
  const scopedKeyframes = [...bundledContents.matchAll('nav-scoped-fade-astro')];
  const globalKeyframes = [...bundledContents.matchAll('nav-global-fade{')];
  assert.ok(scopedKeyframes.length > 0);
  assert.ok(globalKeyframes.length > 0);
});

CSSBundling.run();
