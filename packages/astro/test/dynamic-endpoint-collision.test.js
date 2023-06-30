import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture, silentLogging } from './test-utils.js';

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
			expect(errorMsg.name).to.eq('PrerenderDynamicEndpointPathCollide');
		});
	});

	describe('dev', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dynamic-endpoint-collision/',
			});

			devServer = await fixture.startDevServer({
				logging: silentLogging,
			});
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
			const res = await fixture.fetch('/api/catch/one').then((r) => r.text());
			expect(res).to.equal('{"slug":"one"}');
		});
	});
});
