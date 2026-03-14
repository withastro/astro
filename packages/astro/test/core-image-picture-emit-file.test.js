import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import parseSrcset from 'parse-srcset';
import { loadFixture } from './test-utils.js';

function removeLeadingForwardSlash(path) {
	return path.startsWith('/') ? path.substring(1) : path;
}

describe('astro:image', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('build', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-picture-emit-file/',
			});

			await fixture.build();
		});

		describe('generated images', () => {
			let $;
			before(async () => {
				const html = await fixture.readFile('index.html');
				$ = cheerio.load(html);
			});

			describe('Picture component', () => {
				describe('normal', () => {
					it('default format', async () => {
						const $source = $('#picture source');
						const srcset = parseSrcset($source.attr('srcset'));
						const generatedImages = await fixture.glob('_astro/**/penguin.*.webp');

						assert.deepEqual(generatedImages.length, 1);
						assert.deepEqual(
							generatedImages,
							srcset.map(({ url }) => removeLeadingForwardSlash(url)),
						);
					});

					it('fallback format', async () => {
						const $img = $('#picture img');
						const src = $img.attr('src');
						const generatedFallbackImages = await fixture.glob('_astro/**/penguin.*.jpg');

						assert.deepEqual(generatedFallbackImages.length, 1);
						assert.deepEqual(generatedFallbackImages, [removeLeadingForwardSlash(src)]);
					});
				});

				describe('with widths', () => {
					it('default format', async () => {
						const $source = $('#picture-widths source');
						const srcset = parseSrcset($source.attr('srcset'));
						const generatedImages = await fixture.glob('_astro/**/walrus.*.webp');

						assert.deepEqual(generatedImages.length, 2);
						assert.deepEqual(
							new Set(generatedImages),
							new Set(srcset.map(({ url }) => removeLeadingForwardSlash(url))),
						);
					});

					it('fallback format', async () => {
						const $img = $('#picture-widths img');
						const src = $img.attr('src');
						const srcset = parseSrcset($img.attr('srcset'));
						const generatedFallbackImages = await fixture.glob('_astro/**/walrus.*.jpg');

						assert.deepEqual(generatedFallbackImages.length, 3);
						assert.deepEqual(
							new Set(generatedFallbackImages),
							new Set([{ url: src }, ...srcset].map(({ url }) => removeLeadingForwardSlash(url))),
						);
					});
				});

				describe('with densities', () => {
					it('default format', async () => {
						const $source = $('#picture-densities source');
						const srcset = parseSrcset($source.attr('srcset'));
						const generatedImages = await fixture.glob('_astro/**/polarBear.*.webp');

						assert.deepEqual(generatedImages.length, 3);
						assert.deepEqual(
							new Set(generatedImages),
							new Set(srcset.map(({ url }) => removeLeadingForwardSlash(url))),
						);
					});

					it('fallback format', async () => {
						const $img = $('#picture-densities img');
						const src = $img.attr('src');
						const srcset = parseSrcset($img.attr('srcset'));
						const generatedFallbackImages = await fixture.glob('_astro/**/polarBear.*.jpg');

						assert.deepEqual(generatedFallbackImages.length, 3);
						assert.deepEqual(
							new Set(generatedFallbackImages),
							new Set([{ url: src }, ...srcset].map(({ url }) => removeLeadingForwardSlash(url))),
						);
					});
				});
			});
		});
	});
});
