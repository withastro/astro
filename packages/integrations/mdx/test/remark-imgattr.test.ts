import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture, type Fixture, type DevServer } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/image-remark-imgattr/', import.meta.url);

describe('Testing remark plugins for image processing', () => {
	let fixture: Fixture;

	describe('start dev server', () => {
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: FIXTURE_ROOT,
			});

			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		describe('Test image attributes can be added by remark plugins', () => {
			let $: ReturnType<typeof cheerio.load>;
			before(async () => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('<img> has correct attributes', async () => {
				let $img = $('img');
				assert.equal($img.attr('id'), 'test');
				assert.equal($img.attr('sizes'), '(min-width: 600px) 600w, 300w');
				assert.ok($img.attr('srcset'));
			});

			it('<img> was processed properly', async () => {
				let $img = $('img');
				assert.equal(
					new URL($img.attr('src') ?? '', 'http://example.com').searchParams.get('w'),
					'300',
				);
			});
		});
	});
});
