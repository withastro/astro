import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Dynamic endpoint collision', () => {
	describe('build', () => {
		let fixture;
		let errorMsg;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dynamic-endpoint-collision/',
			});
			try {
				await fixture.build();
			} catch (error) {
				errorMsg = error;
			}
		});

		it('throw error when dynamic endpoint has path collision', async () => {
			expect(errorMsg.errorCode).to.eq(3022);
		});
	});

	describe('throw out an error when it isnt right file name in the dev ', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dynamic-endpoint-collision/',
			});

			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('throw error when dynamic endpoint has path collision', async () => {
			const html = await fixture.fetch('/api/catch').then((res) => res.text());
			const $ = cheerioLoad(html);
			expect($('title').text()).to.equal('PrerenderDynamicEndpointPathCollide');
		});

		it("don't throw error when dynamic endpoint doesn't load the colliding path", async () => {
			const html = await fixture.fetch('/api/catch/one').then((res) => res.text());
			const $ = cheerioLoad(html);
			expect($('pre').text()).to.equal('{"slug":"one"}');
		});
	});
});
