import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { astroCli, wranglerCli } from './_test-utils.js';

const root = new URL('./fixtures/astro-env/', import.meta.url);

describe('astro:env', () => {
	describe('ssr', () => {
		let wrangler;

		before(async () => {
			process.env.API_URL = 'https://google.de';
			process.env.PORT = '4322';
			await astroCli(fileURLToPath(root), 'build');

			wrangler = wranglerCli(fileURLToPath(root));
			await new Promise((resolve) => {
				wrangler.stdout.on('data', (data) => {
					// console.log('[stdout]', data.toString());
					if (data.toString().includes('http://127.0.0.1:8788')) resolve();
				});
				wrangler.stderr.on('data', (_data) => {
					// console.log('[stderr]', data.toString());
				});
			});
		});

		after(() => {
			wrangler.kill();
		});

		it('runtime', async () => {
			const res = await fetch('http://127.0.0.1:8788/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal(
				$('#runtime').text().includes('https://google.de') &&
					$('#runtime').text().includes('4322') &&
					$('#runtime').text().includes('123456789'),
				true,
			);
		});

		it('client', async () => {
			const res = await fetch('http://127.0.0.1:8788/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#client').text().includes('https://google.de'), true);
		});

		it('server', async () => {
			const res = await fetch('http://127.0.0.1:8788/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#server').text().includes('4322'), true);
		});

		it('secret', async () => {
			const res = await fetch('http://127.0.0.1:8788/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#secret').text().includes('123456789'), true);
		});

		it('action secret', async () => {
			const res = await fetch('http://127.0.0.1:8788/test');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#secret').text().includes('123456789'), true);
		});
	});

	describe('dev', () => {
		let cli;
		before(async () => {
			cli = astroCli(fileURLToPath(root), 'dev', '--host', '127.0.0.1');
			await new Promise((resolve) => {
				cli.stdout.on('data', (data) => {
					if (data.includes('http://127.0.0.1:4321/')) {
						resolve();
					}
				});
			});
		});

		after((_done) => {
			cli.kill();
		});

		it('runtime', async () => {
			const res = await fetch('http://127.0.0.1:4321/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal(
				$('#runtime').text().includes('https://google.de') &&
					$('#runtime').text().includes('4322') &&
					$('#runtime').text().includes('123456789'),
				true,
			);
		});

		it('client', async () => {
			const res = await fetch('http://127.0.0.1:4321/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#client').text().includes('https://google.de'), true);
		});

		it('server', async () => {
			const res = await fetch('http://127.0.0.1:4321/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#server').text().includes('4322'), true);
		});

		it('secret', async () => {
			const res = await fetch('http://127.0.0.1:4321/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#secret').text().includes('123456789'), true);
		});

		it('action secret', async () => {
			const res = await fetch('http://127.0.0.1:4321/test');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#secret').text().includes('123456789'), true);
		});
	});
});
