import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import parseSrcset from 'parse-srcset';
import { Logger } from '../dist/core/logger/core.js';
import { testImageService } from './test-image-service.js';
import { loadFixture } from './test-utils.js';
import { testRemoteImageService } from './test-remote-image-service.js';

describe('astro:image:layout', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('local image service', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-layout/',
				image: {
					service: testImageService({ foo: 'bar' }),
					domains: ['avatars.githubusercontent.com'],
				},
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

		describe('basics', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Adds the <img> tag', () => {
				let $img = $('#local img');
				assert.equal($img.length, 1);
				assert.equal($img.attr('src').startsWith('/_image'), true);
			});

			it('includes lazy loading attributes', () => {
				let $img = $('#local img');
				assert.equal($img.attr('loading'), 'lazy');
				assert.equal($img.attr('decoding'), 'async');
				assert.equal($img.attr('fetchpriority'), 'auto');
			});

			it('includes priority loading attributes', () => {
				let $img = $('#local-priority img');
				assert.equal($img.attr('loading'), 'eager');
				assert.equal($img.attr('decoding'), 'sync');
				assert.equal($img.attr('fetchpriority'), 'high');
			});

			it('has width and height - no dimensions set', () => {
				let $img = $('#local img');
				assert.equal($img.attr('width'), '2316');
				assert.equal($img.attr('height'), '1544');
			});

			it('has proper width and height - only width', () => {
				let $img = $('#local-width img');
				assert.equal($img.attr('width'), '350');
				assert.equal($img.attr('height'), '233');
			});

			it('has proper width and height - only height', () => {
				let $img = $('#local-height img');
				assert.equal($img.attr('width'), '300');
				assert.equal($img.attr('height'), '200');
			});

			it('has proper width and height - has both width and height', () => {
				let $img = $('#local-both img');
				assert.equal($img.attr('width'), '300');
				assert.equal($img.attr('height'), '400');
			});

			it('sets the style', () => {
				let $img = $('#local-both img');
				assert.match($img.attr('style'), /--w: 300/);
				assert.match($img.attr('style'), /--h: 400/);
				const classes = $img.attr('class').split(' ');
				assert.ok(classes.includes('aim'));
				assert.ok(classes.includes('aim-re'));
			});

			it('sets the style when no dimensions set', () => {
				let $img = $('#local img');
				assert.match($img.attr('style'), /--w: 2316/);
				assert.match($img.attr('style'), /--h: 1544/);
				const classes = $img.attr('class').split(' ');
				assert.ok(classes.includes('aim'));
				assert.ok(classes.includes('aim-re'));
			});

			it('sets style for fixed image', () => {
				let $img = $('#local-fixed img');
				assert.match($img.attr('style'), /--w: 800/);
				assert.match($img.attr('style'), /--h: 600/);
				const classes = $img.attr('class').split(' ');
				assert.ok(classes.includes('aim'));
				assert.ok(classes.includes('aim-fi'));
			});

			it('sets style for full-width image', () => {
				let $img = $('#local-full-width img');
				const classes = $img.attr('class').split(' ');
				assert.deepEqual(classes, ['aim']);
			});

			it('passes in a parent class', () => {
				let $img = $('#local-class img');
				assert.match($img.attr('class'), /green/);
			});

			it('passes in a parent style', () => {
				let $img = $('#local-style img');
				assert.match($img.attr('style'), /^border: 2px red solid/);
			});
		});

		describe('srcsets', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('has srcset', () => {
				let $img = $('#local img');
				assert.ok($img.attr('srcset'));
				const srcset = parseSrcset($img.attr('srcset'));
				assert.equal(srcset.length, 8);
				assert.equal(srcset[0].url.startsWith('/_image'), true);
				const widths = srcset.map((x) => x.w);
				assert.deepEqual(widths, [640, 750, 828, 1080, 1280, 1668, 2048, 2316]);
			});

			it('constrained - has max of 2x requested size', () => {
				let $img = $('#local-constrained img');
				const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
				assert.equal(widths.at(-1), 1600);
			});

			it('constrained - just has 1x and 2x when smaller than min breakpoint', () => {
				let $img = $('#local-both img');
				const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
				assert.deepEqual(widths, [300, 600]);
			});

			it('fixed - has just 1x and 2x', () => {
				let $img = $('#local-fixed img');
				const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
				assert.deepEqual(widths, [800, 1600]);
			});

			it('full-width: has all breakpoints below image size, ignoring dimensions', () => {
				let $img = $('#local-full-width img');
				const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
				assert.deepEqual(widths, [640, 750, 828, 1080, 1280, 1668, 2048]);
			});
		});

		describe('remote images', () => {
			describe('srcset', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/remote');
					let html = await res.text();
					$ = cheerio.load(html);
				});
				it('has srcset', () => {
					let $img = $('#constrained img');
					assert.ok($img.attr('srcset'));
					const srcset = parseSrcset($img.attr('srcset'));
					const widths = srcset.map((x) => x.w);
					assert.deepEqual(widths, [640, 750, 800, 828, 1080, 1280, 1600]);
				});

				it('constrained - has max of 2x requested size', () => {
					let $img = $('#constrained img');
					const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
					assert.equal(widths.at(-1), 1600);
				});

				it('constrained - just has 1x and 2x when smaller than min breakpoint', () => {
					let $img = $('#small img');
					const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
					assert.deepEqual(widths, [300, 600]);
				});

				it('fixed - has just 1x and 2x', () => {
					let $img = $('#fixed img');
					const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
					assert.deepEqual(widths, [800, 1600]);
				});

				it('full-width: has all breakpoints', () => {
					let $img = $('#full-width img');
					const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
					assert.deepEqual(widths, [640, 750, 828, 1080, 1280, 1668, 2048, 2560]);
				});
			});
		});
	});

	describe('remote image service', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-layout/',
				image: {
					service: testRemoteImageService({ foo: 'bar' }),
					domains: ['images.unsplash.com'],
				},
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

		describe('srcsets', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('has full srcset', () => {
				let $img = $('#local img');
				assert.ok($img.attr('srcset'));
				const srcset = parseSrcset($img.attr('srcset'));
				assert.equal(srcset.length, 10);
				assert.equal(srcset[0].url.startsWith('/_image'), true);
				const widths = srcset.map((x) => x.w);
				assert.deepEqual(widths, [640, 750, 828, 960, 1080, 1280, 1668, 1920, 2048, 2316]);
			});

			it('constrained - has max of 2x requested size', () => {
				let $img = $('#local-constrained img');
				const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
				assert.equal(widths.at(-1), 1600);
			});

			it('constrained - just has 1x and 2x when smaller than min breakpoint', () => {
				let $img = $('#local-both img');
				const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
				assert.deepEqual(widths, [300, 600]);
			});

			it('fixed - has just 1x and 2x', () => {
				let $img = $('#local-fixed img');
				const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
				assert.deepEqual(widths, [800, 1600]);
			});

			it('full-width: has all breakpoints below image size, ignoring dimensions', () => {
				let $img = $('#local-full-width img');
				const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
				assert.deepEqual(widths, [640, 750, 828, 960, 1080, 1280, 1668, 1920, 2048]);
			});
		});

		describe('remote', () => {
			describe('srcset', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/remote');
					let html = await res.text();
					$ = cheerio.load(html);
				});
				it('has srcset', () => {
					let $img = $('#constrained img');
					assert.ok($img.attr('srcset'));
					const srcset = parseSrcset($img.attr('srcset'));
					assert.equal(srcset.length, 8);
					assert.equal(srcset[0].url.startsWith('/_image'), true);
					const widths = srcset.map((x) => x.w);
					assert.deepEqual(widths, [640, 750, 800, 828, 960, 1080, 1280, 1600]);
				});

				it('constrained - has max of 2x requested size', () => {
					let $img = $('#constrained img');
					const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
					assert.equal(widths.at(-1), 1600);
				});

				it('constrained - just has 1x and 2x when smaller than min breakpoint', () => {
					let $img = $('#small img');
					const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
					assert.deepEqual(widths, [300, 600]);
				});

				it('fixed - has just 1x and 2x', () => {
					let $img = $('#fixed img');
					const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
					assert.deepEqual(widths, [800, 1600]);
				});

				it('full-width: has all breakpoints', () => {
					let $img = $('#full-width img');
					const widths = parseSrcset($img.attr('srcset')).map((x) => x.w);
					assert.deepEqual(
						widths,
						[640, 750, 828, 960, 1080, 1280, 1668, 1920, 2048, 2560, 3200, 3840, 4480, 5120, 6016],
					);
				});
			});
		});
	});
});
