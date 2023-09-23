import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import cloudflare from '../dist/index.js';

describe('Wrangler Cloudflare Runtime', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').WranglerCLI} */
	let cli;

	before(async function () {
		fixture = await loadFixture({
			root: './fixtures/cf/',
			output: 'server',
			adapter: cloudflare(),
		});
		await fixture.build();

		cli = await runCLI('./fixtures/cf/', {
			silent: true,
			onTimeout: (ex) => {
				console.log(ex);
				// if fail to start, skip for now as it's very flaky
				this.skip();
			},
		});
	});

	after(async () => {
		await cli?.stop();
	});

	it('Load cf and caches API', async () => {
		let res = await fetch(`http://127.0.0.1:${cli.port}/`);
		expect(res.status).to.equal(200);
		let html = await res.text();
		let $ = cheerio.load(html);

		expect($('#hasRuntime').text()).to.equal('true');
		expect($('#hasCache').text()).to.equal('true');
	});
});

describe('Astro Cloudflare Runtime', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cf/',
			output: 'server',
			adapter: cloudflare({
				runtime: 'local',
			}),
		});
		process.chdir('./test/fixtures/cf');
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('Populates CF, Vars & Bindings', async () => {
		let res = await fixture.fetch('/');
		expect(res.status).to.equal(200);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('#hasRuntime').text()).to.equal('true');
		expect($('#hasCache').text()).to.equal('true');
	});

	it('adds D1 mocking', async () => {
		expect(await fixture.pathExists('../.mf/d1')).to.be.true;

		let res = await fixture.fetch('/d1');
		expect(res.status).to.equal(200);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('#hasDB').text()).to.equal('true');
		expect($('#hasPRODDB').text()).to.equal('true');
		expect($('#hasACCESS').text()).to.equal('true');
	});
});
