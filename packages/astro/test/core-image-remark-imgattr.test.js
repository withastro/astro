import { Writable } from 'node:stream';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

import { Logger } from '../dist/core/logger/core.js';
import { loadFixture } from './test-utils.js';

describe('astro:image', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('dev', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-remark-imgattr/',
			});

			devServer = await fixture.startDevServer({
				logger: new Logger({
					level: 'error',
					dest: new Writable({
						objectMode: true,
						write(event, _, callback) {
							logs.push(event);
							callback();
						},
					}),
				}),
			});
		});

		after(async () => {
			await devServer.stop();
		});

		describe('Test image attributes can be added by remark plugins', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Image has eager loading meaning getImage passed props it doesnt use through it', async () => {
				let $img = $('img');
				expect($img.attr('loading')).to.equal('eager');
			});

			it('Image src contains w=50 meaning getImage correctly used props added through the remark plugin', async () => {
				let $img = $('img');
				expect(new URL($img.attr('src'), 'http://example.com').searchParams.get('w')).to.equal(
					'50'
				);
			});
		});
	});
});
