import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { Logger } from '../dist/core/logger/core.js';
import { loadFixture } from './test-utils.js';

describe('astro:assets - SVG Components', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('dev', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-svg/',
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
				$ = cheerio.load(html, { xml: true });
			});

			it('Adds the <svg> tag with the definition', () => {
				const $svg = $('#definition svg');
				assert.equal($svg.length, 1);
				assert.equal($svg.attr('role'), 'img');

				const $symbol = $svg.find('symbol');
				assert.equal($symbol.length, 1);
				assert.equal($symbol.attr('id').startsWith('a:'), true);
				
				const $use = $svg.find('symbol + use');
				assert.equal($use.length, 1);
				assert.equal($use.attr('xlink:href').startsWith('#a:'), true);
				assert.equal($use.attr('xlink:href').slice(1), $symbol.attr('id'));
			});
			it('Adds the <svg> tag that uses the definition', () => {
				let $svg = $('#reused svg');
				assert.equal($svg.length, 1);
				assert.equal($svg.attr('role'), 'img');

				const $symbol = $svg.find('symbol');
				assert.equal($symbol.length, 0);

				const definitionId = $('#definition svg symbol').attr('id')
				const $use = $svg.find('use');
				assert.equal($use.length, 1);
				assert.equal($use.attr('xlink:href').startsWith('#a:'), true);
				assert.equal($use.attr('xlink:href').slice(1), definitionId);
			});
		});

		describe('props', () => {
			describe('size', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/size');
					let html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('has no height and width - no dimensions set', () => {
					let $svg = $('#base svg');
					assert.equal($svg.length, 1);
					assert.equal(!!$svg.attr('height'), false);
					assert.equal(!!$svg.attr('width'), false);
				});
				it('has height and width - no dimensions set', () => {
					let $svg = $('#base-with-defaults svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('height'), '1em');
					assert.equal($svg.attr('width'), '1em');
				});
				it('has height and width - string size set', () => {
					let $svg = $('#size-string svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('height'), '32');
					assert.equal($svg.attr('width'), '32');
					assert.equal(!!$svg.attr('size'), false);
				});
				it('has height and width - number size set', () => {
					let $svg = $('#size-number svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('height'), '48');
					assert.equal($svg.attr('width'), '48');
					assert.equal(!!$svg.attr('size'), false);
				});
				it('has height and width overridden - size set', () => {
					let $svg = $('#override-attrs svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('height'), '16');
					assert.equal($svg.attr('width'), '16');
					assert.equal(!!$svg.attr('size'), false);
				});
				it('has unchanged width - size set', () => {
					let $svg = $('#ignore-size-for-width svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('height'), '1em');
					assert.equal($svg.attr('width'), '24');
					assert.equal(!!$svg.attr('size'), false);
				});
				it('has unchanged height - size set', () => {
					let $svg = $('#ignore-size-for-height svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('height'), '24');
					assert.equal($svg.attr('width'), '1em');
					assert.equal(!!$svg.attr('size'), false);
				});
				it('has unchanged height and with - size set', () => {
					let $svg = $('#ignore-size svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('height'), '24');
					assert.equal($svg.attr('width'), '24');
					assert.equal(!!$svg.attr('size'), false);
				});
			});
			describe('inline', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/inline');
					let html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('adds the svg into the document directly', () => {
					let $svg = $('#inline svg');
					assert.equal($svg.length, 1);
					assert.equal(!!$svg.attr('viewBox'), true);
					assert.equal($svg.attr('height'), '1em');
					assert.equal($svg.attr('width'), '1em');
					assert.equal($svg.attr('role'), 'img');
					assert.equal(!!$svg.attr('inline'), false);

					const $symbol = $svg.find('symbol')
					assert.equal($symbol.length, 0);
					const $use = $svg.find('use')
					assert.equal($use.length, 0);
					const $path = $svg.find('path');
					assert.equal($path.length, 1);
				});
				it('adds the svg into the document and overrides the dimensions', () => {
					let $svg = $('#inline-with-size svg');
					assert.equal($svg.length, 1);
					assert.equal(!!$svg.attr('viewBox'), true);
					assert.equal($svg.attr('height'), '24');
					assert.equal($svg.attr('width'), '24');
					assert.equal($svg.attr('role'), 'img');
					assert.equal(!!$svg.attr('inline'), false);

					const $symbol = $svg.find('symbol')
					assert.equal($symbol.length, 0);
					const $use = $svg.find('use')
					assert.equal($use.length, 0);
					const $path = $svg.find('path');
					assert.equal($path.length, 1);
				})
			});
			describe('title', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/title');
					let html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('adds a title into the SVG', () => {
					let $svg = $('#base svg');
					assert.equal($svg.length, 1);
					assert.equal(!!$svg.attr('title'), false);

					const $title = $('#base svg > title');
					assert.equal($title.length, 1);
					assert.equal($title.text(), 'GitHub Logo')
				});
			});
			describe('strip', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/strip');
					let html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('removes unnecessary attributes', () => {
					let $svg = $('#base svg');
					assert.equal($svg.length, 1);
					assert.equal(!!$svg.attr('xmlns'), false);
					assert.equal(!!$svg.attr('xmlns:xlink'), false);
					assert.equal(!!$svg.attr('version'), false);
				});
			});
			describe('additional props', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/props');
					let html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('adds the svg into the document directly', () => {
					let $svg = $('#base svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('aria-hidden'), 'true');
					assert.equal($svg.attr('id'), 'plus');
					assert.equal($svg.attr('style'), `color:red;font-size:32px`);
					assert.equal($svg.attr('class'), 'foobar');
					assert.equal($svg.attr('data-state'), 'open');

					const $symbol = $svg.find('symbol')
					assert.equal($symbol.length, 1);
					const $use = $svg.find('use')
					assert.equal($use.length, 1);
				});
				it('allows overriding the role attribute', () => {
					let $svg = $('#role svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('role'), 'presentation');
				});
			});
		});

		describe('multiple', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/multiple');
				let html = await res.text();
				$ = cheerio.load(html, { xml: true });
			});

			it('adds only one definition for each svg', () => {
				// First SVG
				let $svg = $('.one svg');
				assert.equal($svg.length, 2);
				let $symbol = $('.one svg > symbol');
				assert.equal($symbol.length, 1);
				let $use = $('.one svg > use');
				assert.equal($use.length, 2);
				let defId = $('.one.def svg > use').attr('id');
				let useId = $('.one.use svg > use').attr('id');
				assert.equal(defId, useId);

				// Second SVG
				$svg = $('.two svg');
				assert.equal($svg.length, 2);
				$symbol = $('.two svg > symbol');
				assert.equal($symbol.length, 1);
				$use = $('.two svg > use');
				assert.equal($use.length, 2);
				defId = $('.two.def svg > use').attr('id');
				useId = $('.two.use svg > use').attr('id');
				assert.equal(defId, useId);

				
				// Third SVG
				$svg = $('.three svg');
				assert.equal($svg.length, 1);
				$symbol = $('.three svg > symbol');
				assert.equal($symbol.length, 1);
				$use = $('.three svg > use');
				assert.equal($use.length, 1);
			});
		});

		describe('markdown', () => {
			it('Adds the <svg> tag with the definition', async () => {
				let res = await fixture.fetch('/blog/basic');
				let html = await res.text();
				const $ = cheerio.load(html, { xml: true });

				const $svg = $('svg');
				assert.equal($svg.length, 1);
				assert.equal($svg.attr('role'), 'img');

				const $symbol = $svg.find('symbol');
				assert.equal($symbol.length, 1);
				assert.equal($symbol.attr('id').startsWith('a:'), true);
				
				const $use = $svg.find('symbol + use');
				assert.equal($use.length, 1);
				assert.equal($use.attr('xlink:href').startsWith('#a:'), true);
				assert.equal($use.attr('xlink:href').slice(1), $symbol.attr('id'));
			});
			it('Adds the <svg> tag that uses the definition', async () => {
				let res = await fixture.fetch('/blog/sprite');
				let html = await res.text();
				const $ = cheerio.load(html, { xml: true });

				const $svg = $('svg');
				assert.equal($svg.length, 2);
				$svg.each(function() { assert.equal($(this).attr('role'), 'img') });

				const definitionId =  $($svg[0]).find('symbol').attr('id')

				const $reuse = $($svg[1]);
				const $symbol = $reuse.find('symbol');
				assert.equal($symbol.length, 0);

				const $use = $reuse.find('use');
				assert.equal($use.length, 1);
				assert.equal($use.attr('xlink:href').startsWith('#a:'), true);
				assert.equal($use.attr('xlink:href').slice(1), definitionId);
			});
			it('Adds the <svg> tag that applies props', async () => {
				let res = await fixture.fetch('/blog/props');
				let html = await res.text();
				const $ = cheerio.load(html, { xml: true });

				const $svg = $('svg');
				assert.equal($svg.length, 1);
				assert.equal($svg.attr('role'), 'img');
				assert.equal($svg.attr('height'), '48');
				assert.equal($svg.attr('width'), '48');
				assert.equal(!!$svg.attr('size'), false);
				assert.equal($svg.attr('class'), 'icon');
				assert.equal($svg.attr('data-icon'), 'github');
				assert.equal($svg.attr('aria-description'), 'Some description');
				assert.equal($svg.find('title').text(), 'Find out more on GitHub!');
			});
		});
	});
});
