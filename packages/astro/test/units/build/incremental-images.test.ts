import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getStaticImageList, restoreStaticImages } from '../../../dist/assets/build/generate.js';
import type { AssetsGlobalStaticImagesList } from '../../../dist/assets/types.js';

describe('collectStaticImages merge with restored incremental images', () => {
	afterEach(() => {
		// Clean up the global static images list between tests.
		if (globalThis.astroAsset) {
			delete globalThis.astroAsset.staticImages;
		}
	});

	it('preserves restored transforms when adapter images share the same source path', () => {
		// Simulate the incremental build flow:
		// 1. A cached page restores its 200px transform via restoreStaticImages
		// 2. The adapter's collectStaticImages returns a 100px transform for the
		//    same source image (from a rendered page)
		// 3. The merge loop should keep both transforms

		const originalPath = '/_astro/photo.abc123.png';

		// Step 1: Restore cached page's image transform
		restoreStaticImages([
			{
				originalPath,
				originalSrcPath: '/src/assets/photo.png',
				hash: 'hash200',
				finalPath: '/_astro/photo.abc123_hash200.webp',
				transform: {
					src: { src: originalPath, width: 1000, height: 800, format: 'png' },
					width: 200,
					format: 'webp',
				},
			},
		]);

		const listBefore = getStaticImageList();
		assert.equal(listBefore.get(originalPath)?.transforms.size, 1);
		assert.ok(listBefore.get(originalPath)?.transforms.has('hash200'));

		// Step 2: Simulate adapter returning images for only the rendered page
		const adapterImages: AssetsGlobalStaticImagesList = new Map([
			[
				originalPath,
				{
					originalSrcPath: '/src/assets/photo.png',
					transforms: new Map([
						[
							'hash100',
							{
								finalPath: '/_astro/photo.abc123_hash100.webp',
								transform: {
									src: { src: originalPath, width: 1000, height: 800, format: 'png' },
									width: 100,
									format: 'webp',
								},
							},
						],
					]),
				},
			],
		]);

		// Step 3: Merge using the fixed logic (same as generatePages)
		const staticImageList = getStaticImageList();
		for (const [path, entry] of adapterImages) {
			const existing = staticImageList.get(path);
			if (existing) {
				for (const [hash, transform] of entry.transforms) {
					if (!existing.transforms.has(hash)) {
						existing.transforms.set(hash, transform);
					}
				}
			} else {
				staticImageList.set(path, entry);
			}
		}

		// Both transforms should be present
		const entry = staticImageList.get(originalPath);
		assert.ok(entry, 'entry for original path should exist');
		assert.equal(entry.transforms.size, 2, 'both transforms should be preserved');
		assert.ok(entry.transforms.has('hash200'), 'restored 200px transform should be kept');
		assert.ok(entry.transforms.has('hash100'), 'adapter 100px transform should be added');
	});

	it('adds new source paths from adapter images when no restored entry exists', () => {
		const originalPath = '/_astro/photo.abc123.png';

		const adapterImages: AssetsGlobalStaticImagesList = new Map([
			[
				originalPath,
				{
					originalSrcPath: '/src/assets/photo.png',
					transforms: new Map([
						[
							'hashA',
							{
								finalPath: '/_astro/photo.abc123_hashA.webp',
								transform: {
									src: { src: originalPath, width: 500, height: 400, format: 'png' },
									width: 100,
									format: 'webp',
								},
							},
						],
					]),
				},
			],
		]);

		const staticImageList = getStaticImageList();
		for (const [path, entry] of adapterImages) {
			const existing = staticImageList.get(path);
			if (existing) {
				for (const [hash, transform] of entry.transforms) {
					if (!existing.transforms.has(hash)) {
						existing.transforms.set(hash, transform);
					}
				}
			} else {
				staticImageList.set(path, entry);
			}
		}

		const entry = staticImageList.get(originalPath);
		assert.ok(entry, 'new entry should be added');
		assert.equal(entry.transforms.size, 1);
		assert.ok(entry.transforms.has('hashA'));
	});
});
