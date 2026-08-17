import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveEntryData, updateImageReferencesInData } from '../../../dist/content/runtime.js';
import { imageSrcToImportId } from '../../../dist/assets/utils/resolveImports.js';
import type { ImageMetadata } from '../../../dist/assets/types.js';

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
	it('replaces a top-level image src with resolved ImageMetadata', () => {
		const data = { image: './hero.png' };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map, [['image']]);
		assert.deepEqual(result.image, heroMeta);
	});

	it('resolves an image nested inside an object', () => {
		const data = { cover: { src: './hero.png', alt: 'Hero' } };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map, [['cover', 'src']]);
		assert.deepEqual(result.cover.src, heroMeta);
		assert.equal(result.cover.alt, 'Hero');
	});

	it('resolves images nested inside an array', () => {
		const data = { gallery: ['./hero.png', './hero.png'] };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map, [
			['gallery', 0],
			['gallery', 1],
		]);
		assert.deepEqual(result.gallery[0], heroMeta);
		assert.deepEqual(result.gallery[1], heroMeta);
	});

	it('keeps the raw src string when the id is not in the map', () => {
		const data = { image: './missing.png' };
		const result = updateImageReferencesInData(data, FILE_NAME, new Map(), [['image']]);
		assert.equal(result.image, './missing.png');
	});

	it('returns the data unchanged when there are no image imports', () => {
		const data = { title: 'Hello', slug: 'hello-world' };
		const result = updateImageReferencesInData(data, FILE_NAME, new Map(), undefined);
		assert.equal(result, data);
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
		const data = { hero: './hero.png', thumb: './thumb.png' };
		const result = updateImageReferencesInData(data, FILE_NAME, map, [['hero'], ['thumb']]);
		assert.deepEqual(result.hero, heroMeta);
		assert.deepEqual(result.thumb, thumbMeta);
	});

	it('does not mutate the original data', () => {
		const data = { image: './hero.png' };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map, [['image']]);
		assert.deepEqual(result.image, heroMeta);
		assert.equal(data.image, './hero.png');
		assert.notEqual(result, data);
	});

	it('shares non-image sibling values by reference without cloning them', () => {
		// A value structuredClone cannot handle (it has a method), standing in for
		// the class instances produced by Zod transforms (e.g. Temporal.PlainDate).
		const publishedOn = {
			iso: '2026-08-04',
			format() {
				return this.iso;
			},
		};
		assert.throws(() => structuredClone(publishedOn), /DataCloneError|could not be cloned/);

		const data = { image: './hero.png', publishedOn };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map, [['image']]);

		assert.deepEqual(result.image, heroMeta);
		assert.equal(result.publishedOn, publishedOn);
		assert.equal(result.publishedOn.format(), '2026-08-04');
	});

	it('preserves Map and Set siblings by reference', () => {
		const metadata = new Map([['title', 'Hello']]);
		const flags = new Set(['showTitle']);
		const data = { image: './hero.png', metadata, flags };
		const map = makeImageMap('./hero.png', heroMeta);
		const result = updateImageReferencesInData(data, FILE_NAME, map, [['image']]);

		assert.deepEqual(result.image, heroMeta);
		assert.equal(result.metadata, metadata);
		assert.equal(result.metadata.get('title'), 'Hello');
		assert.equal(result.flags, flags);
		assert.equal(result.flags.has('showTitle'), true);
	});
});

describe('resolveEntryData', () => {
	it('returns the data by reference when there are no image imports', () => {
		const data = { title: 'Hello', nested: { count: 1 } };
		const result = resolveEntryData(
			{ id: 'entry', data, filePath: FILE_NAME },
			makeImageMap('./hero.png', heroMeta),
		);
		assert.equal(result, data);
	});

	it('resolves image references at their recorded paths', () => {
		const data = { image: './hero.png' };
		const result = resolveEntryData(
			{ id: 'entry', data, filePath: FILE_NAME, imageImports: [['image']] },
			makeImageMap('./hero.png', heroMeta),
		);

		assert.deepEqual(result.image, heroMeta);
		assert.equal(data.image, './hero.png');
	});
});
