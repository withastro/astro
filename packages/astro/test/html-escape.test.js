import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('HTML Escape', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-escape/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const div = $('div');
			expect(div.text()).to.equal('${foo}');

			const span = $('span');
			expect(span.attr('${attr}')).to.equal('');

			const ce = $('custom-element');
			expect(ce.attr('x-data')).to.equal('`${test}`');

			const script = $('script');
			expect(script.text()).to.equal('console.log(`hello ${"world"}!`)');
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('works', async () => {
			const res = await fixture.fetch('/');

			expect(res.status).to.equal(200);

			const html = await res.text();
			const $ = cheerio.load(html);

			const div = $('div');
			expect(div.text()).to.equal('${foo}');

			const span = $('span');
			expect(span.attr('${attr}')).to.equal('');

			const ce = $('custom-element');
			expect(ce.attr('x-data')).to.equal('`${test}`');

			const script = $('script');
			expect(script.text()).to.equal('console.log(`hello ${"world"}!`)');
		});
	});
});
