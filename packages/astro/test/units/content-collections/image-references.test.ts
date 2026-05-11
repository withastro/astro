import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { updateImageReferencesInData } from '../../../dist/content/runtime.js';
import { imageSrcToImportId } from '../../../dist/assets/utils/resolveImports.js';
import type { ImageMetadata } from '../../../dist/assets/types.js';

const IMAGE_PREFIX = '__ASTRO_IMAGE_';
const FILE_NAME = 'src/content/blog/post.md';

function makeImageMap(src: string, meta: ImageMetadata): Map<string, ImageMetadata> {
	const id = imageSrcToImportId(src, FILE_NAME);
	assert.ok(id, `imageSrcToImportId returned undefined for src="${src}"`);
	return new Map([[id, meta]]);
}

const heroMeta: ImageMetadata = {
	src: '/_astro/hero.abc123.png',
	width: 800,
	height: 600,
	format: 'png',
};

describe('updateImageReferencesInData', () => {
	it('replaces a top-level image placeholder with resolved ImageMetadata', () => {
		const data = { image: `${IMAGE_PREFIX}./hero.png` };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map);
		assert.deepEqual(result.image, heroMeta);
	});

	it('resolves an image nested inside an object', () => {
		const data = { cover: { src: `${IMAGE_PREFIX}./hero.png`, alt: 'Hero' } };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map);
		assert.deepEqual(result.cover.src, heroMeta);
	});

	it('resolves images nested inside an array', () => {
		const data = {
			gallery: [`${IMAGE_PREFIX}./hero.png`, `${IMAGE_PREFIX}./hero.png`],
		};
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map);
		assert.deepEqual(result.gallery[0], heroMeta);
		assert.deepEqual(result.gallery[1], heroMeta);
	});

	it('falls back to the raw src string when the id is not in the map', () => {
		const data = { image: `${IMAGE_PREFIX}./missing.png` };
		const result = updateImageReferencesInData(data, FILE_NAME, new Map());
		assert.equal(result.image, './missing.png');
	});

	it('leaves non-image strings unchanged', () => {
		const data = { title: 'Hello', slug: 'hello-world' };
		const result = updateImageReferencesInData(data, FILE_NAME, new Map());
		assert.equal(result.title, 'Hello');
		assert.equal(result.slug, 'hello-world');
	});

	it('handles an empty imageAssetMap gracefully', () => {
		const data = { image: `${IMAGE_PREFIX}./hero.png` };
		const result = updateImageReferencesInData(data, FILE_NAME, new Map());
		assert.equal(result.image, './hero.png');
	});

	it('handles undefined imageAssetMap — falls back to raw src', () => {
		const data = { image: `${IMAGE_PREFIX}./hero.png` };
		const result = updateImageReferencesInData(data, FILE_NAME, undefined);
		assert.equal(result.image, './hero.png');
	});

	it('handles data with no image fields', () => {
		const data = { title: 'My Post', tags: ['a', 'b'], count: 3 };
		const result = updateImageReferencesInData(data, FILE_NAME, new Map());
		assert.deepEqual(result, data);
	});

	it('resolves multiple different images in the same entry', () => {
		const thumbMeta: ImageMetadata = {
			src: '/_astro/thumb.xyz.png',
			width: 100,
			height: 100,
			format: 'png',
		};
		const heroId = imageSrcToImportId('./hero.png', FILE_NAME);
		const thumbId = imageSrcToImportId('./thumb.png', FILE_NAME);
		assert.ok(heroId);
		assert.ok(thumbId);
		const map = new Map<string, ImageMetadata>([
			[heroId, heroMeta],
			[thumbId, thumbMeta],
		]);
		const data = {
			hero: `${IMAGE_PREFIX}./hero.png`,
			thumb: `${IMAGE_PREFIX}./thumb.png`,
		};
		const result = updateImageReferencesInData(data, FILE_NAME, map);
		assert.deepEqual(result.hero, heroMeta);
		assert.deepEqual(result.thumb, thumbMeta);
	});
});

describe('updateImageReferencesInData caching', () => {
	it('returns the same reference for repeated calls with the same data object', () => {
		const data = { image: `${IMAGE_PREFIX}./hero.png` };
		const map = makeImageMap('./hero.png', heroMeta);
		const first = updateImageReferencesInData(data, FILE_NAME, map);
		const second = updateImageReferencesInData(data, FILE_NAME, map);
		assert.equal(first, second, 'expected the exact same object reference on the second call');
	});

	it('returns cached result when the result object itself is passed back in', () => {
		const data = { image: `${IMAGE_PREFIX}./hero.png` };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map);
		const again = updateImageReferencesInData(result, FILE_NAME, map);
		assert.equal(result, again, 'expected the same reference when passing in an already-resolved object');
	});

	it('invalidates cache when imageAssetMap reference changes', () => {
		const data = { image: `${IMAGE_PREFIX}./hero.png` };
		const map1 = makeImageMap('./hero.png', heroMeta);
		const result1 = updateImageReferencesInData(data, FILE_NAME, map1);

		const altMeta: ImageMetadata = { src: '/_astro/hero.v2.png', width: 1024, height: 768, format: 'png' };
		const map2 = makeImageMap('./hero.png', altMeta);
		const result2 = updateImageReferencesInData(data, FILE_NAME, map2);

		assert.notEqual(result1, result2, 'expected a new result after imageAssetMap changed');
		assert.deepEqual(result2.image, altMeta);
	});

	it('caches independently for different data objects with the same imageAssetMap', () => {
		const map = makeImageMap('./hero.png', heroMeta);
		const data1 = { image: `${IMAGE_PREFIX}./hero.png` };
		const data2 = { image: `${IMAGE_PREFIX}./hero.png` };
		const result1 = updateImageReferencesInData(data1, FILE_NAME, map);
		const result2 = updateImageReferencesInData(data2, FILE_NAME, map);
		assert.notEqual(result1, result2, 'different input objects should produce different cached entries');
		assert.deepEqual(result1.image, heroMeta);
		assert.deepEqual(result2.image, heroMeta);

		assert.equal(updateImageReferencesInData(data1, FILE_NAME, map), result1);
		assert.equal(updateImageReferencesInData(data2, FILE_NAME, map), result2);
	});
});
