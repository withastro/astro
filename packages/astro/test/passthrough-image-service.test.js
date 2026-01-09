import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('passthroughImageService', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/passthrough-image-service/',
		});
	});

	describe('dev', () => {
		let $;
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();

			const html = await fixture.fetch('/').then((res) => res.text());
			$ = cheerio.load(html);
		});

		after(async () => {
			await devServer.stop();
		});

		it('includes img element in dev', () => {
			const $img = $('#image img');
			assert.equal($img.length, 1);
		});

		it('serves SVG logo with correct content type', async () => {
			const $img = $('#logo img');
			const src = $img.attr('src');

			const response = await fixture.fetch(src);
			const contentType = response.headers.get('content-type');

			assert.ok(
				contentType.includes('image/svg+xml'),
				`Expected SVG content type, got: ${contentType}`,
			);
		});
	});

	describe('build', () => {
		let $;

		before(async () => {
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
		});

		describe('Assets', () => {
			it('does not generate webp images', async () => {
				const webpImages = await fixture.glob('_astro/**/*.webp');
				assert.equal(webpImages.length, 0);
			});

			it('preserves original image format', async () => {
				const jpgImages = await fixture.glob('_astro/**/*.jpg');
				assert.ok(jpgImages.length > 0);
			});
		});

		describe('Image component', () => {
			it('includes img element', () => {
				const $img = $('#image img');
				assert.equal($img.length, 1);
			});

			it('preserves original format', () => {
				const $img = $('#image img');
				const src = $img.attr('src');
				assert.ok(src.endsWith('.jpg'), `Should preserve jpg format, got: ${src}`);
			});
		});

		describe('Picture component', () => {
			it('includes <picture> element', () => {
				const $picture = $('#picture picture');
				assert.equal($picture.length, 1);
			});

			it('includes <img> inside picture', () => {
				const $img = $('#picture img');
				assert.equal($img.length, 1);
			});

			it('preserves original format', () => {
				const $img = $('#picture img');
				const src = $img.attr('src');
				assert.ok(src.endsWith('.jpg'), `Should preserve jpg format, got: ${src}`);
			});
		});

		describe('SVG Logo component', () => {
			it('includes img element', () => {
				const $img = $('#logo img');
				assert.equal($img.length, 1);
			});

			it('preserves SVG format', () => {
				const $img = $('#logo img');
				const src = $img.attr('src');
				assert.ok(src.endsWith('.svg'), `Should preserve svg format, got: ${src}`);
			});
		});
	});
});
