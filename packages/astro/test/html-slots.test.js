import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('HTML Slots', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-slots/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const slotDefault = $('#default');
			expect(slotDefault.text()).to.equal('Default');

			const a = $('#a');
			expect(a.text().trim()).to.equal('A');

			const b = $('#b');
			expect(b.text().trim()).to.equal('B');

			const c = $('#c');
			expect(c.text().trim()).to.equal('C');

			const inline = $('#inline');
			expect(inline.html()).to.equal('<slot is:inline=""></slot>');
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

			const slotDefault = $('#default');
			expect(slotDefault.text()).to.equal('Default');

			const a = $('#a');
			expect(a.text().trim()).to.equal('A');

			const b = $('#b');
			expect(b.text().trim()).to.equal('B');

			const c = $('#c');
			expect(c.text().trim()).to.equal('C');

			const inline = $('#inline');
			expect(inline.html()).to.equal('<slot is:inline=""></slot>');
		});
	});
});
