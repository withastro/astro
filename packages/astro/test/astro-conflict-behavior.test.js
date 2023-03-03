import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import { load as cheerioLoad } from 'cheerio';


describe('astro-conflict-behavior', () => {
	describe('build', () => {
		let fixture;
		let errorMsg

		before(async () => {

			fixture = await loadFixture({
				root: './fixtures/astro-conflict-behavior/',
			});
			try {
				await fixture.build();
			} catch (error) {
				errorMsg = error
			}

		});
		it('skiping generate an file when set up undefined in getStaticPaths when pro the environment', async () => {
			const html = await fixture.pathExists('/index');
			expect(html).to.be.false;
			expect(errorMsg.errorCode).to.equal(3022)
		});
	});

	describe('dev', () => {
		let fixture;
		let devServer;
		before(async () => {

			fixture = await loadFixture({
				root: './fixtures/astro-conflict-behavior/',
			});

			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});
		it('skiping generate an file when set up undefined in getStaticPaths when dev the environmen', async () => {
			const html = await fixture
			.fetch('/index')
			.then((res) => res.text());
			const $ = cheerioLoad(html);
			expect($('title').text()).to.equal('InvalidGetEndpointsPathParam');
		});

	});
});
