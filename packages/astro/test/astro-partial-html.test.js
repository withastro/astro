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
		const allInjectedStyles = $('style[data-astro-injected]').text();
		expect(allInjectedStyles).to.match(/\.astro-[^{]+{color:red}/);
	});

	it('injects framework styles', async () => {
		const html = await fixture.fetch('/jsx').then((res) => res.text());
		const $ = cheerio.load(html);

		// test 1: Doctype first
		expect(html).to.match(/^<!DOCTYPE html/);

		// test 2: link tag present
		const allInjectedStyles = $('style[data-astro-injected]').text().replace(/\s*/g,"");
		expect(allInjectedStyles).to.match(/h1{color:red;}/);
	});
});

describe('Head Component', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-partial-html/',
		});
		await fixture.build();
	});

	it('injects Astro hydration scripts', async () => {
		const html = await fixture.readFile('/head/index.html');
		const $ = cheerio.load(html);

		const hydrationId = $('astro-root').attr('uid');

		const script = $('script').html();
		expect(script).to.match(new RegExp(hydrationId));
	});
});
