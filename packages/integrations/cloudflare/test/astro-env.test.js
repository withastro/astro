import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';

describe('astro:env', () => {
	describe('ssr', () => {
		let fixture;
		let previewServer;

		before(async () => {
			console.log('[cloudflare:test] astro:env ssr before');
			process.env.API_URL = 'https://google.de';
			process.env.PORT = '4322';
			fixture = await loadFixture({
				root: './fixtures/astro-env/',
			});
			await fixture.build();
			previewServer = await fixture.preview();
		});

		after(async () => {
			console.log('[cloudflare:test] astro:env ssr after');
			await previewServer.stop();
			console.log('[cloudflare:test] astro:env ssr finished');
		});

		it('runtime', async () => {
			const res = await fixture.fetch('/');
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
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#client').text().includes('https://google.de'), true);
		});

		it('server', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#server').text().includes('4322'), true);
		});

		it('secret', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#secret').text().includes('123456789'), true);
		});

		it('action secret', async () => {
			const res = await fixture.fetch('/test');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#secret').text().includes('123456789'), true);
		});
	});

	describe('dev', () => {
		let devServer;
		let fixture;

		before(async () => {
			console.log('[cloudflare:test] astro:env dev before');
			fixture = await loadFixture({
				root: './fixtures/astro-env/',
			});
			devServer = await fixture.startDevServer();
			await fixture.fetch('/');
		});

		after(async () => {
			console.log('[cloudflare:test] astro:env dev after');
			await devServer.stop();
			console.log('[cloudflare:test] astro:env dev finished');
		});

		it('runtime', async () => {
			const res = await fixture.fetch('/');
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
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#client').text().includes('https://google.de'), true);
		});

		it('server', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#server').text().includes('4322'), true);
		});

		it('secret', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#secret').text().includes('123456789'), true);
		});

		it('action secret', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#secret').text().includes('123456789'), true);
		});
	});
});
