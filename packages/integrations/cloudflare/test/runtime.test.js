import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import cloudflare from '../dist/index.js';

describe('Runtime Locals', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {import('./test-utils.js').WranglerCLI} */
	let cli;

	before(async function () {
		fixture = await loadFixture({
			root: './fixtures/runtime/',
			output: 'server',
			adapter: cloudflare(),
		});
		await fixture.build();

		cli = await runCLI('./fixtures/runtime/', { silent: true, port: 8793 });
		await cli.ready.catch((e) => {
			console.log(e);
			// if fail to start, skip for now as it's very flaky
			this.skip();
		});
	});

	after(async () => {
		await cli.stop();
	});

	it('has CF and Caches', async () => {
		let res = await fetch(`http://127.0.0.1:8793/`);
		expect(res.status).to.equal(200);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('#env').text()).to.contain('SECRET_STUFF');
		expect($('#env').text()).to.contain('secret');
		expect($('#hasRuntime').text()).to.contain('true');
		expect($('#hasCache').text()).to.equal('true');
	});
});
