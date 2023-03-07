import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('throw out an error when it isnt right file name', () => {
	describe('throw out an error when it isnt right file name in the build', () => {
		let fixture;
		let errorMsg;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/invail-extension/',
			});
			try {
				await fixture.build();
			} catch (error) {
				errorMsg = error
			}

		});

		it("build", async () => {
			expect(errorMsg.errorCode).to.eq(3022) 
		});
	});

	describe('throw out an error when it isnt right file name in the dev ', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/invail-extension/',
			});

			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it("dev", async () => {
			const html = await fixture.fetch('/api/catch').then((res) => res.text());
			const $ = cheerioLoad(html);

			expect($('title').text()).to.equal('InvalidExtension');
			const htmlone = await fixture.fetch('/api/catch/one').then((res) => res.text());
			const $one = cheerioLoad(htmlone);
			expect($one('h1').text()).to.equal('');
		});
	});
});
