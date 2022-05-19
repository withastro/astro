import { isWindows, loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('Error packages: react-spectrum', () => {
	if (isWindows) return;

	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/error-react-spectrum',
		});
	});
	after(async () => {
		devServer && devServer.stop();
	});

	it('properly detect syntax errors in template', async () => {
		devServer = await fixture.startDevServer();
		let html = await fixture.fetch('/').then(res => res.text());
		let $ = cheerio.load(html);
		const msg = $('.error-message').text();
		expect(msg).to.match(/@adobe\/react-spectrum is not compatible/);
	});
});
