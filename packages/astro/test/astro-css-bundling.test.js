/**
 * UNCOMMENT: implement CSS bundling
import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils';

// note: the hashes should be deterministic, but updating the file contents will change hashes
// be careful not to test that the HTML simply contains CSS, because it always will! filename and quanity matter here (bundling).
const EXPECTED_CSS = {
  '/index.html': ['/_astro/common-', '/_astro/index-'], // don’t match hashes, which change based on content
  '/one/index.html': ['/_astro/common-', '/_astro/one/index-'],
  '/two/index.html': ['/_astro/common-', '/_astro/two/index-'],
  '/preload/index.html': ['/_astro/common-', '/_astro/preload/index-'],
  '/preload-merge/index.html': ['/_astro/preload-merge/index-'],
};
const UNEXPECTED_CSS = ['/_astro/components/nav.css', '../css/typography.css', '../css/colors.css', '../css/page-index.css', '../css/page-one.css', '../css/page-two.css'];

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-css-bundling/' });
  await fixture.build({ mode: 'production' });
});

describe('CSS Bundling', () => {
  it('Bundles CSS', async () => {
    const builtCSS = new Set();

    // for all HTML files…
    for (const [filepath, css] of Object.entries(EXPECTED_CSS)) {
      const html = await fixture.readFile(filepath);
      const $ = cheerio.load(html);

      // test 1: assert new bundled CSS is present
      for (const href of css) {
        const link = $(`link[rel="stylesheet"][href^="${href}"]`);
        expect(link).to.have.lengthOf(1);
        builtCSS.add(link.attr('href'));
      }

      // test 2: assert old CSS was removed
      for (const href of UNEXPECTED_CSS) {
        const link = $(`link[rel="stylesheet"][href="${href}"]`);
        expect(link).to.have.lengthOf(0);
      }

      // test 3: preload tags was not removed and attributes was preserved
      if (filepath === '/preload/index.html') {
        const stylesheet = $('link[rel="stylesheet"][href^="/_astro/preload/index-"]');
        const preload = $('link[rel="preload"][href^="/_astro/preload/index-"]');
        expect(stylesheet[0].attribs.media).to.equal('print');
        expect(preload).to.have.lengthOf(1); // Preload tag was removed
      }

      // test 4: preload tags was not removed and attributes was preserved
      if (filepath === '/preload-merge/index.html') {
        const preload = $('link[rel="preload"]');
        expect(preload).to.have.lengthOf(1);
      }

      // test 5: assert all bundled CSS was built and contains CSS
      for (const url of builtCSS.keys()) {
        const css = await context.readFile(url);
        expect(css).to.be.ok;
      }

      // test 6: assert ordering is preserved (typography.css before colors.css)
      const bundledLoc = [...builtCSS].find((k) => k.startsWith('/_astro/common-'));
      const bundledContents = await context.readFile(bundledLoc);
      const typographyIndex = bundledContents.indexOf('body{');
      const colorsIndex = bundledContents.indexOf(':root{');
      expect(typographyIndex).toBeLessThan(colorsIndex);

      // test 7: assert multiple style blocks were bundled (Nav.astro includes 2 scoped style blocks)
      const scopedNavStyles = [...bundledContents.matchAll('.nav.astro-')];
      expect(scopedNavStyles).to.have.lengthOf(2);

      // test 8: assert <style global> was not scoped (in Nav.astro)
      const globalStyles = [...bundledContents.matchAll('html{')];
      expect(globalStyles).to.have.lengthOf(1);

      // test 9: assert keyframes are only scoped for non-global styles (from Nav.astro)
      const scopedKeyframes = [...bundledContents.matchAll('nav-scoped-fade-astro')];
      const globalKeyframes = [...bundledContents.matchAll('nav-global-fade{')];
      expect(scopedKeyframes.length).toBeGreaterThan(0);
      expect(globalKeyframes.length).toBeGreaterThan(0);
    }
  });
});
*/

it.skip('is skipped', () => {});
