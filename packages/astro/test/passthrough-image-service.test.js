import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('passthroughImageService', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('build', () => {
		let $;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/passthrough-image-service/',
			});

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
	});
});
