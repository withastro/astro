import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('HTML Component', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/html-component/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const h1 = $('h1');
			const foo = $('#foo');

			expect(h1.text()).to.equal('Hello component!');
			expect(foo.text()).to.equal('bar');
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

			const h1 = $('h1');
			const foo = $('#foo');

			expect(h1.text()).to.equal('Hello component!');
			expect(foo.text()).to.equal('bar');
		});
	});
});
