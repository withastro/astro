import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';
import { astroCli, wranglerCli } from './_test-utils.js';

const root = new URL('./fixtures/wrangler-runtime/', import.meta.url);

describe('Runtime Wrangler', () => {
	let wrangler;

	before(async () => {
		await astroCli(fileURLToPath(root), 'build');

		wrangler = wranglerCli(fileURLToPath(root));
		await new Promise((resolve) => {
			wrangler.stdout.on('data', (data) => {
				console.log('[stdout]', data.toString());
				if (data.toString().includes('http://127.0.0.1:8788')) resolve();
			});
			wrangler.stderr.on('data', (data) => {
				console.log('[stderr]', data.toString());
			});
		});
	});

	after((done) => {
		wrangler.kill();
		setTimeout(() => {
			console.log('CLEANED');
			done();
		}, 1000);
	});

	it('exists', async () => {
		let res = await fetch(`http://127.0.0.1:8788/`);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('#hasRuntime').text()).to.contain('true');
	});

	it('has environment variables', async () => {
		let res = await fetch(`http://127.0.0.1:8788/`);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('#hasENV').text()).to.contain('true');
	});

	it('has Cloudflare request object', async () => {
		let res = await fetch(`http://127.0.0.1:8788/`);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('#hasCF').text()).to.contain('true');
	});

	it('has Cloudflare cache', async () => {
		let res = await fetch(`http://127.0.0.1:8788/`);
		let html = await res.text();
		let $ = cheerio.load(html);
		expect($('#hasCACHES').text()).to.contain('true');
	});
});
