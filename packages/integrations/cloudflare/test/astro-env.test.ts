import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('astro:env', () => {
	describe('ssr', () => {
		let fixture: Fixture;
		let previewServer: PreviewServer;
		before(async () => {
			process.env.API_URL = 'https://google.de';
			process.env.PORT = '4322';
			fixture = await loadFixture({
				root: './fixtures/astro-env/',
			});
			await fixture.build();
			previewServer = await fixture.preview();
		});

		after(async () => {
			await previewServer.stop();
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
		let devServer: DevServer;
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-env/',
			});
			devServer = await fixture.startDevServer();
			await fixture.fetch('/');
		});

		after(async () => {
			await devServer.stop();
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
