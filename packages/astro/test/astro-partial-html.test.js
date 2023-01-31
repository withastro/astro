import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Partial HTML', async () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-partial-html/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('injects Astro styles and scripts', async () => {
		const html = await fixture.fetch('/astro').then((res) => res.text());
		const $ = cheerio.load(html);

		// test 1: Doctype first
		expect(html).to.match(/^<!DOCTYPE html/);

		// test 2: correct CSS present
		const allInjectedStyles = $('style').text();
		expect(allInjectedStyles).to.match(/\:where\(\.astro-[^{]+{color:red}/);
	});

	it('injects framework styles', async () => {
		const html = await fixture.fetch('/jsx').then((res) => res.text());
		const $ = cheerio.load(html);

		// test 1: Doctype first
		expect(html).to.match(/^<!DOCTYPE html/);

		// test 2: link tag present
		const allInjectedStyles = $('style').text().replace(/\s*/g, '');
		expect(allInjectedStyles).to.match(/h1{color:red;}/);
	});

	it('pages with a head, injection happens inside', async () => {
		const html = await fixture.fetch('/with-head').then((res) => res.text());
		const $ = cheerio.load(html);
		expect($('style')).to.have.lengthOf(1);
	});
});
