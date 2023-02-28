import { expect, assert } from 'chai';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';
import { Writable } from 'node:stream';

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
				root: './fixtures/core-image/',
				experimental: {
					images: true,
				}
			});
	
			devServer = await fixture.startDevServer({
				logging: {
					level: 'error',
					dest: new Writable({
						objectMode: true,
						write(event, _, callback) {
							logs.push(event);
							callback();
						}
					})
				}
			});
		});
	
		after(async () => {
			await devServer.stop();
		});

		describe('basics', () => {
			let $;
			before(async() => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Adds the <img> tag', () => {
				let $img = $('#local img');
				expect($img).to.have.a.lengthOf(1);
				expect($img.attr('src').startsWith('/_image')).to.equal(true);
			});

			it('includes loading and decoding attributes', () => {
				let $img = $('#local img');
				expect(!!$img.attr('loading')).to.equal(true);
				expect(!!$img.attr('decoding')).to.equal(true);
			});

			it('includes the provided alt', () => {
				let $img = $('#local img');
				expect($img.attr('alt')).to.equal('a penguin');
			});
		});

		describe('remote', () => {
			describe('working', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/');
					let html = await res.text();
					$ = cheerio.load(html);
				});

				it('includes the provided alt', async () => {
					let $img = $('#remote img');
					expect($img.attr('alt')).to.equal('fred');
				});

				it('includes loading and decoding attributes', () => {
					let $img = $('#remote img');
					expect(!!$img.attr('loading')).to.equal(true);
					expect(!!$img.attr('decoding')).to.equal(true);
				});
			});

			it('error if no width and height', async () => {
				logs.length = 0;
				let res = await fixture.fetch('/remote-error-no-dimensions');
				await res.text();

				expect(logs).to.have.a.lengthOf(1);
				expect(logs[0].message).to.contain('For remote images, width and height are required.');
			});

			it('error if no height', async () => {
				logs.length = 0;
				let res = await fixture.fetch('/remote-error-no-height');
				await res.text();

				expect(logs).to.have.a.lengthOf(1);
				expect(logs[0].message).to.contain('For remote images, height is required.');
			});
		})
	});
});
