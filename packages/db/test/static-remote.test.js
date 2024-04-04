import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../astro/test/test-utils.js';
import { setupRemoteDbServer } from './test-utils.js';

describe('astro:db', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/static-remote/', import.meta.url),
			output: 'static',
		});
	});

	describe('static build --remote', () => {
		let remoteDbServer;

		before(async () => {
			remoteDbServer = await setupRemoteDbServer(fixture.config);
			await fixture.build();
		});

		after(async () => {
			await remoteDbServer?.stop();
		});

		it('Can render page', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			expect($('li').length).to.equal(1);
		});
	});
});
