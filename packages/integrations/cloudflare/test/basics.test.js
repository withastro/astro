import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('Basic app', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').WranglerCLI} */
	let cli;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
		});
		await fixture.build();

		cli = await runCLI('./fixtures/basics/', { silent: true, port: 8789 });
		await cli.ready;
	});

	after(async () => {
		await cli.stop();
	});

	it('can render', async () => {
		let res = await fetch(`http://127.0.0.1:8789/`);
		expect(res.status).to.equal(200);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('h1').text()).to.equal('Testing');
		expect($('#env').text()).to.equal('secret');
	});
});
