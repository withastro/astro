import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';

import { AstroLogger } from '../dist/core/logger/core.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('astro:image', () => {
	let fixture: Fixture;

	describe('dev', () => {
		let devServer: DevServer;
		const logs: Array<{ type: any; level: 'error'; message: string }> = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-remark-imgattr/',
				outDir: './dist/core-image-remark-imgattr/',
			});

			const logger = new AstroLogger({
				level: 'error',
				destination: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push(event);
						callback();
					},
				}),
			});
			devServer = await fixture.startDevServer({
				// @ts-expect-error: `_logger` is an internal API
				_logger: logger,
			});
		});

		after(async () => {
			await devServer.stop();
		});

		describe('Test image attributes can be added by remark plugins', () => {
			let $: cheerio.CheerioAPI;
			before(async () => {
				const res = await fixture.fetch('/');
				const html = await res.text();
				$ = cheerio.load(html);
			});

			it('Image has eager loading meaning getImage passed props it doesnt use through it', async () => {
				const $img = $('img');
				assert.equal($img.attr('loading'), 'eager');
			});

			it('Image src contains w=50 meaning getImage correctly used props added through the remark plugin', async () => {
				const $img = $('img');
				assert.equal(new URL($img.attr('src')!, 'http://example.com').searchParams.get('w'), '50');
			});

			it('Image alt and title survive the __ASTRO_IMAGE_ round-trip escaped exactly once', async () => {
				// The attribute is JSON-serialized into the markup and decoded again
				// later; an ampersand must come back as one ampersand, not as the
				// text of an entity left behind by an incomplete decode. cheerio
				// hands back the decoded DOM value, so a double escape shows up
				// here as a literal "&amp;".
				const $img = $('img');
				assert.equal($img.attr('alt'), 'A & B');
				assert.equal($img.attr('title'), 'C & D');
			});
		});
	});
});
