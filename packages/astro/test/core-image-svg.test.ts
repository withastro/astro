import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { AstroLogger } from '../dist/core/logger/core.js';
import { svgoOptimizer } from '../dist/config/entrypoint.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('astro:assets - SVG Components', () => {
	let fixture: Fixture;

	describe('dev', () => {
		let devServer: DevServer;
		const logs: Array<{ type: any; level: 'error'; message: string }> = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-svg/',
				outDir: './dist/core-image-svg-dev/',
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
				// @ts-expect-error: `logger` is @internal in AstroInlineConfig so it's stripped from dist types
				logger,
			});
		});

		after(async () => {
			await devServer.stop();
		});

		describe('basics', () => {
			let $: cheerio.CheerioAPI;
			before(async () => {
				const res = await fixture.fetch('/');
				const html = await res.text();
				$ = cheerio.load(html, { xml: true });
			});
			it('Inlines the SVG by default', () => {
				const $svg = $('#default svg');
				assert.equal($svg.length, 1);
			});
		});

		describe('props', () => {
			describe('strip', () => {
				let $: cheerio.CheerioAPI;
				let html: string;

				before(async () => {
					const res = await fixture.fetch('/strip');
					html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('removes unnecessary attributes', () => {
					const $svg = $('#base svg');
					assert.equal($svg.length, 1);
					assert.equal(!!$svg.attr('xmlns'), false);
					assert.equal(!!$svg.attr('xmlns:xlink'), false);
					assert.equal(!!$svg.attr('version'), false);
				});
				it('ignores additional root level nodes', () => {
					let $svg = $('#additionalNodes');
					// Ensure we only have the svg node
					assert.equal($svg.children().length, 1);
					assert.equal(($svg.children()[0] as { name: string }).name, 'svg');
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
				let $: cheerio.CheerioAPI;
				before(async () => {
					const res = await fixture.fetch('/props');
					const html = await res.text();
					$ = cheerio.load(html, { xml: true });
				});

				it('adds the props to the svg', () => {
					const $svg = $('#base svg');
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
					const $svg = $('#role svg');
					assert.equal($svg.length, 1);
					assert.equal($svg.attr('role'), 'presentation');
				});
			});
		});

		describe('markdown', () => {
			it('Adds the <svg> tag with the definition', async () => {
				const res = await fixture.fetch('/blog/basic');
				const html = await res.text();
				const $ = cheerio.load(html, { xml: true });

				const $svg = $('svg');
				assert.equal($svg.length, 1);

				const $path = $svg.children('path');
				assert.equal($path.length > 0, true);
			});
			it('Adds the <svg> tag that applies props', async () => {
				const res = await fixture.fetch('/blog/props');
				const html = await res.text();
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
				const res = await fixture.fetch('/serialize.json');
				const json = await res.json();
				assert.equal(json.image.format, 'svg');
				assert.equal(json.image.width, 85);
				assert.equal(json.image.height, 107);
				assert.ok(json.image.src.startsWith('/'));
			});
		});
	});

	describe('SVGO optimization', () => {
		let optimizedFixture: Fixture;
		let optimizedDevServer: DevServer;

		before(async () => {
			optimizedFixture = await loadFixture({
				root: './fixtures/core-image-svg/',
				experimental: {
					svgOptimizer: svgoOptimizer({
						plugins: [
							'preset-default',
							{
								name: 'removeViewBox',
							},
						],
					}),
				},
				outDir: './dist/core-image-svg-svgo-optimization/',
			});

			optimizedDevServer = await optimizedFixture.startDevServer();
		});

		after(async () => {
			await optimizedDevServer.stop();
		});

		describe('with optimization enabled', () => {
			let $: cheerio.CheerioAPI;
			let html: string;

			before(async () => {
				const res = await optimizedFixture.fetch('/optimized');
				html = await res.text();
				$ = cheerio.load(html, { xml: true });
			});

			it('optimizes SVG with SVGO', () => {
				const $svg = $('#optimized svg');
				assert.equal($svg.length, 1);
				assert.equal(html.includes('This is a comment'), false);
				assert.equal(!!$svg.attr('xmlns:xlink'), false);
				assert.equal(!!$svg.attr('version'), false);
			});

			it('preserves functional SVG structure', () => {
				const $svg = $('#optimized svg');
				const $paths = $svg.find('path');
				assert.equal($paths.length >= 1, true);
				assert.equal($svg.attr('width'), '24');
				assert.equal($svg.attr('height'), '24');
			});
		});
	});
});
