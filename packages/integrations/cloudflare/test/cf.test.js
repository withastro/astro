import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import cloudflare from '../dist/index.js';

describe('Cf metadata and caches', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').WranglerCLI} */
	let cli;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cf/',
			output: 'server',
			adapter: cloudflare(),
		});
		await fixture.build();

		cli = await runCLI('./fixtures/cf/', { silent: false, port: 8788 });
		await cli.ready;
	});

	after(async () => {
		await cli.stop();
	});

	it('Load cf and caches API', async () => {
		let res = await fetch(`http://127.0.0.1:8788/`);
		expect(res.status).to.equal(200);
		let html = await res.text();
		let $ = cheerio.load(html);

		expect($('#cf').text()).to.contain(
			'city',
			`Expected "city" to exist in runtime, but got ${$('#cf').text()}`
		);
		expect($('#hasCache').text()).to.equal('true');
	});
});
