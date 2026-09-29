import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StaticImageRegistry } from '../../../dist/assets/build/generate.js';
import type {
	AssetsGlobalStaticImagesList,
	SerializedStaticImage,
} from '../../../dist/assets/types.js';

const originalPath = '/_astro/photo.abc123.png';

function image(hash: string, width: number): SerializedStaticImage {
	return {
		originalPath,
		originalSrcPath: '/src/assets/photo.png',
		hash,
		finalPath: `/_astro/photo.abc123_${hash}.webp`,
		transform: {
			src: { src: originalPath, width: 1000, height: 800, format: 'png' } as any,
			width,
			format: 'webp',
		},
	};
}

describe('StaticImageRegistry', () => {
	it('nests transforms by original path and dedupes them by hash, first wins', () => {
		const registry = new StaticImageRegistry();
		registry.addStaticImages([image('hash200', 200), image('hash100', 100)]);
		registry.addStaticImages([{ ...image('hash200', 200), finalPath: '/other.webp' }]);

		const entry = registry.images.get(originalPath);
		assert.ok(entry);
		assert.equal(entry.originalSrcPath, '/src/assets/photo.png');
		assert.deepEqual([...entry.transforms.keys()], ['hash200', 'hash100']);
		assert.equal(entry.transforms.get('hash200')?.finalPath, '/_astro/photo.abc123_hash200.webp');
	});

	it('merges metadata from rendered and skipped pages', () => {
		const registry = new StaticImageRegistry();
		// A rendered page, then a page replayed from the incremental cache sharing the image.
		registry.addMetadata({
			staticImages: [image('hash100', 100)],
			referencedImages: ['/src/assets/rendered.png'],
		});
		registry.addMetadata({
			staticImages: [image('hash200', 200)],
			referencedImages: ['/src/assets/shared.png'],
		});
		registry.addMetadata(undefined);

		assert.equal(registry.images.get(originalPath)?.transforms.size, 2);
		assert.deepEqual(
			registry.referencedImages,
			new Set(['/src/assets/rendered.png', '/src/assets/shared.png']),
		);
	});

	it('preserves registered transforms when merging an image list sharing the source path', () => {
		const registry = new StaticImageRegistry();
		registry.addStaticImages([image('hash200', 200)]);

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
								transform: image('hash100', 100).transform,
							},
						],
					]),
				},
			],
			[
				'/_astro/other.png',
				{
					originalSrcPath: '/src/assets/other.png',
					transforms: new Map([
						[
							'hashA',
							{ finalPath: '/_astro/other_hashA.webp', transform: image('hashA', 50).transform },
						],
					]),
				},
			],
		]);
		registry.addStaticImageList(adapterImages);

		const entry = registry.images.get(originalPath);
		assert.ok(entry);
		assert.ok(entry.transforms.has('hash200'), 'registered transform should be kept');
		assert.ok(entry.transforms.has('hash100'), 'merged transform should be added');
		assert.ok(registry.images.get('/_astro/other.png')?.transforms.has('hashA'));
	});
});
