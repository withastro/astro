import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, isWindows } from './test-utils.js';

describe('HTML minification', () => {
	describe('in DEV enviroment', () => {
		let fixture;
		let devServer;
		const regex = /[\r\n]+/gm;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/minification-html/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			devServer.stop();
		});

		it('should emit compressed HTML in the emitted file', async () => {
			let res = await fixture.fetch(`/`);
			expect(res.status).to.equal(200);
			const html = await res.text();
			expect(regex.test(html.slice(-100))).to.equal(false);
		});

	})
	describe('in SSG mode', () => {
		let fixture;
		const regex = /[\r\n]+/gm;
		before(async () => {
			fixture = await loadFixture({ root: './fixtures/minification-html/' });
			await fixture.build();
		});

		it('should emit compressed HTML in the emitted file', async () => {
			const html = await fixture.readFile('/index.html');
			expect(regex.test(html.slice(20))).to.equal(false);
		});
	})
});
