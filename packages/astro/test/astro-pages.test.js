import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, isWindows} from './test-utils.js';

describe('Pages', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro pages/' });
		await fixture.build();
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can find page with "index" at the end file name', async () => {
			const html = await fixture.readFile('/posts/name-with-index/index.html');
			const $ = cheerio.load(html);

			expect($('h1').text()).to.equal('Name with index');
		});
	});

	if(isWindows) return;

	describe('Development', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Is able to load md pages', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#testing').length).to.be.greaterThan(0);
		});
	});
});
