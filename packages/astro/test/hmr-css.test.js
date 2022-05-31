import { isWindows, loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('HMR - CSS', () => {
	if (isWindows) return;

	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/hmr-css/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Timestamp URL used by Vite gets the right mime type', async () => {
		let res = await fixture.fetch(
			'/src/pages/index.astro?astro=&type=style&index=0&lang.css=&t=1653657441095'
		);
		let headers = res.headers;
		expect(headers.get('content-type')).to.equal('text/css');
	});
});
