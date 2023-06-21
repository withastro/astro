import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import cloudflare from '../dist/index.js';

describe('Cf metadata and caches', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cf/',
			output: 'server',
			adapter: cloudflare(),
		});
		await fixture.build();
	});

	it('Load cf and caches API', async () => {
		const { ready, stop } = runCLI('./fixtures/cf/', { silent: true, port: 8788 });

		try {
			await ready;
			let res = await fetch(`http://localhost:8788/`);
			expect(res.status).to.equal(200);
			let html = await res.text();
			let $ = cheerio.load(html);
			// console.log($('#cf').text(), html);
			expect($('#cf').text()).to.contain('city');
			expect($('#hasCache').text()).to.equal('true');
		} finally {
			await stop();
		}
	});
});
