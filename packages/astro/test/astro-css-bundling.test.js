import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

// note: the hashes should be deterministic, but updating the file contents will change hashes
// be careful not to test that the HTML simply contains CSS, because it always will! filename and quanity matter here (bundling).
const EXPECTED_CSS = {
	'/index.html': ['./assets/index', './assets/typography'], // don’t match hashes, which change based on content
	'/one/index.html': ['../assets/one'],
	'/two/index.html': ['../assets/two', '../assets/typography'],
	'/preload/index.html': ['../assets/preload'],
	'/preload-merge/index.html': ['../assets/preload-merge'],
};
const UNEXPECTED_CSS = ['/src/components/nav.css', '../css/typography.css', '../css/colors.css', '../css/page-index.css', '../css/page-one.css', '../css/page-two.css'];

describe('CSS Bundling', function () {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/astro-css-bundling/' });
		await fixture.build({ mode: 'production' });
	});

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
				const outHref = link.attr('href');
				builtCSS.add(outHref.startsWith('../') ? outHref.substr(2) : outHref);
			}

			// test 2: assert old CSS was removed
			for (const href of UNEXPECTED_CSS) {
				const link = $(`link[rel="stylesheet"][href="${href}"]`);
				expect(link).to.have.lengthOf(0);
			}

			// test 3: preload tags was not removed and attributes was preserved
			if (filepath === '/preload/index.html') {
				const stylesheet = $('link[rel="stylesheet"][href^="../assets/preload"]');
				const preload = $('link[rel="preload"][href^="../assets/preload"]');
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
				const css = await fixture.readFile(url);
				expect(css).to.be.ok;
			}
		}
	});
});
