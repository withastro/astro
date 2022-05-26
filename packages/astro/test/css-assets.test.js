import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Assets in CSS', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-assets/',
			vite: {
				build: {
					assetsInlineLimit: 0
				}
			}
		});
		await fixture.build();
	});

	function getAllMatches(re, text) {
		let count = 0;
		while (re.exec(text) !== null) {
				++count;
		}
		return count;
	}

	async function getCSSForPage(pathname) {
		const html = await fixture.readFile(pathname);
		const $ = cheerio.load(html);
		const cssPath = $('link').attr('href');
		const css = await fixture.readFile(cssPath);
		return css;
	}

	it('Bundled CSS does not have __VITE_ASSET__', async () => {
		let css = await getCSSForPage('/one/index.html');
		expect(css).to.not.contain('__VITE_ASSET__');
		css = await getCSSForPage('/two/index.html');
		expect(css).to.not.contain('__VITE_ASSET__');
	});

	it('Pages contain only their own CSS', async () => {
		let css = await getCSSForPage('/one/index.html');
		expect(getAllMatches(/font-face/g, css)).to.equal(1);
		css = await getCSSForPage('/two/index.html');
		expect(getAllMatches(/font-face/g, css)).to.equal(1);
	});
});
