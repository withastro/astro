import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('CSS Bundling (ESM import)', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-css-bundling-import/',
		});
		await fixture.build();
	});

	it('CSS output in import order', async () => {
		// note: this test is a little confusing, but the main idea is that
		// page-2.astro contains all of page-1.astro, plus some unique styles.
		// we only test page-2 to ensure the proper order is observed.
		const html = await fixture.readFile('/page-2/index.html');
		const $ = cheerio.load(html);

		let css = '';

		for (const style of $('link[rel=stylesheet]')) {
			const href = style.attribs.href.replace(/^\.\./, '');
			if (!href) continue;
			css += await fixture.readFile(href);
		}

		// test 1: insure green comes after red (site.css)
		expect(css.indexOf('p{color:green}')).to.be.greaterThan(css.indexOf('p{color:red}'));

		// test 2: insure green comes after blue (page-1.css)
		expect(css.indexOf('p{color:green}')).to.be.greaterThan(css.indexOf('p{color:#00f}'));
	});

	it('no empty CSS files', async () => {
		for (const page of ['/page-1/index.html', '/page-2/index.html']) {
			const html = await fixture.readFile(page);
			const $ = cheerio.load(html);

			for (const style of $('link[rel=stylesheet]')) {
				const href = style.attribs.href.replace(/^\.\./, '');
				if (!href) continue;
				const css = await fixture.readFile(href);

				expect(css).to.be.ok;
			}
		}
	});

	it('?raw and ?url CSS imports are ignored', async () => {
		// note: this test is a little confusing as well, but the main idea is that
		// page-3.astro should have site.css imported as an ESM in InlineLayout.astro
		// as well as the styles from page-3.css as an inline <style>.
		const html = await fixture.readFile('/page-3/index.html');
		const $ = cheerio.load(html);

		let css = '';

		for (const style of $('link[rel=stylesheet]')) {
			const href = style.attribs.href.replace(/^\.\./, '');
			if (!href) continue;
			css += await fixture.readFile(href);
		}

		// test 1: insure green is included (site.css)
		expect(css.indexOf('p{color:red}')).to.be.greaterThanOrEqual(0);

		// test 2: insure purple is not included as an import (page-3.css)
		// this makes sure the styles imported with ?raw and ?url weren't bundled
		expect(css.indexOf('p{color:purple}')).to.be.lessThan(0);

		// test 3: insure purple was inlined (page-3.css inlined with set:html)
		// this makes sure the styles imported with ?url were inlined
		let inlineCss = $('style').html().replace(/\s/g, '').replace('/n', '');
		expect(inlineCss.indexOf('p{color:purple;}')).to.be.greaterThanOrEqual(0);
	});
});
