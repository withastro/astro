import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { astroCli, wranglerCli } from './_test-utils.js';

const root = new URL('./fixtures/wrangler-runtime/', import.meta.url);

describe('WragnlerRuntime', () => {
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
		const res = await fetch('http://127.0.0.1:8788/');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasRuntime').text()).to.contain('true');
	});

	it('has environment variables', async () => {
		const res = await fetch('http://127.0.0.1:8788/');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasENV').text()).to.contain('true');
	});

	it('has Cloudflare request object', async () => {
		const res = await fetch('http://127.0.0.1:8788/');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasCF').text()).to.contain('true');
	});

	it('has Cloudflare cache', async () => {
		const res = await fetch('http://127.0.0.1:8788/');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasCACHES').text()).to.contain('true');
	});
});
