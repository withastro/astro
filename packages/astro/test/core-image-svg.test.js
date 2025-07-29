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
			it('Inlines the SVG by default', () => {
				const $svg = $('#default svg');
				assert.equal($svg.length, 1);
			});
		});

		describe('props', () => {
			describe('strip', () => {
				let $;
				let html;

				before(async () => {
					let res = await fixture.fetch('/strip');
					html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('removes unnecessary attributes', () => {
					let $svg = $('#base svg');
					assert.equal($svg.length, 1);
					assert.equal(!!$svg.attr('xmlns'), false);
					assert.equal(!!$svg.attr('xmlns:xlink'), false);
					assert.equal(!!$svg.attr('version'), false);
				});
				it('ignores additional root level nodes', () => {
					let $svg = $('#additionalNodes');
					// Ensure we only have the svg node
					assert.equal($svg.children().length, 1);
					assert.equal($svg.children()[0].name, 'svg');
					$svg = $svg.children('svg');
					assert.equal($svg.length, 1);
					assert.equal(!!$svg.attr('xmlns'), false);
					assert.equal(!!$svg.attr('xmlns:xlink'), false);
					assert.equal(!!$svg.attr('version'), false);
				});
				it('should have no empty attributes', () => {
					assert.equal(/\s=""/.test(html), false);
				});
			});
			describe('additional props', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/props');
					let html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('adds the props to the svg', () => {
					let $svg = $('#base svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('aria-hidden'), 'true');
					assert.equal($svg.attr('id'), 'plus');
					assert.equal($svg.attr('style'), `color:red;font-size:32px`);
					assert.equal($svg.attr('class'), 'foobar');
					assert.equal($svg.attr('data-state'), 'open');

					const $path = $svg.children('path');
					assert.equal($path.length, 1);
				});
				it('allows specifying the role attribute', () => {
					let $svg = $('#role svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('role'), 'presentation');
				});
			});
		});

		describe('markdown', () => {
			it('Adds the <svg> tag with the definition', async () => {
				let res = await fixture.fetch('/blog/basic');
				let html = await res.text();
				const $ = cheerio.load(html, { xml: true });

				const $svg = $('svg');
				assert.equal($svg.length, 1);

				const $path = $svg.children('path');
				assert.equal($path.length > 0, true);
			});
			it('Adds the <svg> tag that applies props', async () => {
				let res = await fixture.fetch('/blog/props');
				let html = await res.text();
				const $ = cheerio.load(html, { xml: true });

				const $svg = $('svg');
				assert.equal($svg.length, 1);
				assert.equal($svg.attr('height'), '48');
				assert.equal($svg.attr('width'), '48');
				assert.equal($svg.attr('class'), 'icon');
				assert.equal($svg.attr('data-icon'), 'github');
				assert.equal($svg.attr('aria-description'), 'Some description');
			});
		});

		describe('metadata', () => {
			it('returns a serializable metadata object', async () => {
				let res = await fixture.fetch('/serialize.json');
				let json = await res.json();
				assert.equal(json.image.format, 'svg');
				assert.equal(json.image.width, 85);
				assert.equal(json.image.height, 107);
				assert.ok(json.image.src.startsWith('/'));
			});
		});
	});
});
