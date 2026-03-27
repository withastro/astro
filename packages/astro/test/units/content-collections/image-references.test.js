// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { updateImageReferencesInData } from '../../../dist/content/runtime.js';
import { imageSrcToImportId } from '../../../dist/assets/utils/resolveImports.js';

const IMAGE_PREFIX = '__ASTRO_IMAGE_';
const FILE_NAME = 'src/content/blog/post.md';

function makeImageMap(src, meta) {
	const id = imageSrcToImportId(src, FILE_NAME);
	return new Map([[id, meta]]);
}

const heroMeta = {
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
		const thumbMeta = { src: '/_astro/thumb.xyz.png', width: 100, height: 100, format: 'png' };
		const heroId = imageSrcToImportId('./hero.png', FILE_NAME);
		const thumbId = imageSrcToImportId('./thumb.png', FILE_NAME);
		const map = new Map([
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
