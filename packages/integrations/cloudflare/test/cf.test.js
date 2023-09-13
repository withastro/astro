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

		cli = await runCLI('./fixtures/cf/', { silent: true, port: 8786 });
		await cli.ready.catch((e) => {
			console.log(e);
			// if fail to start, skip for now as it's very flaky
			this.skip();
		});
	});

	after(async () => {
		await cli.stop();
	});

	it('Load cf and caches API', async () => {
		let res = await fetch(`http://127.0.0.1:8786/`);
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
			image: {
				service: {
					entrypoint: 'astro/assets/services/noop',
				},
			},
		});
		process.chdir('./test/fixtures/cf');
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Populates CF, Vars & Bindings', async () => {
		let res = await fixture.fetch('/');
		expect(res.status).to.equal(200);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('#hasRuntime').text()).to.equal('true');
		expect($('#hasCache').text()).to.equal('true');
	});
});
