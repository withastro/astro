import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

// note: the hashes should be deterministic, but updating the file contents will change hashes
// be careful not to test that the HTML simply contains CSS, because it always will! filename and quanity matter here (bundling).
const EXPECTED_CSS = {
	'/index.html': ['/assets/'], // don’t match hashes, which change based on content
	'/one/index.html': ['/assets/'],
	'/two/index.html': ['/assets/'],
};
const UNEXPECTED_CSS = [
	'/src/components/nav.css',
	'../css/typography.css',
	'../css/colors.css',
	'../css/page-index.css',
	'../css/page-one.css',
	'../css/page-two.css',
];

describe('CSS Bundling', function () {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('defaults', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-css-bundling/',
			});
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
					expect(link.length).to.be.greaterThanOrEqual(1);
					const outHref = link.attr('href');
					builtCSS.add(outHref.startsWith('../') ? outHref.slice(2) : outHref);
				}

				// test 2: assert old CSS was removed
				for (const href of UNEXPECTED_CSS) {
					const link = $(`link[rel="stylesheet"][href="${href}"]`);
					expect(link).to.have.lengthOf(0);
				}

				// test 3: assert all bundled CSS was built and contains CSS
				for (const url of builtCSS.keys()) {
					const bundledCss = await fixture.readFile(url);
					expect(bundledCss).to.be.ok;
				}
			}
		});

		it('there are 4 css files', async () => {
			const dir = await fixture.readdir('/assets');
			expect(dir).to.have.a.lengthOf(4);
		});

		it('CSS includes hashes', async () => {
			const [firstFound] = await fixture.readdir('/assets');
			expect(firstFound).to.match(/[a-z]+\.[0-9a-z]{8}\.css/);
		});
	});

	describe('using custom assetFileNames config', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-css-bundling/',

				vite: {
					build: {
						rollupOptions: {
							output: {
								assetFileNames: 'assets/[name][extname]',
								entryFileNames: '[name].js',
							},
						},
					},
				},
			});
			await fixture.build({ mode: 'production' });
		});

		it('there are 4 css files', async () => {
			const dir = await fixture.readdir('/assets');
			expect(dir).to.have.a.lengthOf(4);
		});

		it('CSS does not include hashes hashes', async () => {
			const [firstFound] = await fixture.readdir('/assets');
			expect(firstFound).to.not.match(/[a-z]+\.[0-9a-z]{8}\.css/);
		});

		it('there are 2 index named CSS files', async () => {
			const dir = await fixture.readdir('/assets');
			const indexNamedFiles = dir.filter((name) => name.startsWith('index'));
			expect(indexNamedFiles).to.have.a.lengthOf(2);
		});
	});
});
