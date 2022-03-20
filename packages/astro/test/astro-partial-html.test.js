import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Partial HTML', async () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-partial-html/',
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
		const link = $('link').attr('href');
		const css = await fixture
			.fetch(link, {
				headers: {
					accept: 'text/css',
				},
			})
			.then((res) => res.text());
		expect(css).to.match(/\.astro-[^{]+{color:red}/);
	});

	it('injects framework styles', async () => {
		const html = await fixture.fetch('/jsx').then((res) => res.text());
		const $ = cheerio.load(html);

		// test 1: Doctype first
		expect(html).to.match(/^<!DOCTYPE html/);

		// test 2: link tag present
		const href = $('link[rel=stylesheet][data-astro-injected]').attr('href');
		expect(href).to.be.ok;
	});
});
