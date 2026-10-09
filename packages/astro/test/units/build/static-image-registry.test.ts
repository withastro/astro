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

	it('merges a deprecated collectStaticImages() list into restored images', () => {
		const registry = new StaticImageRegistry();
		registry.addStaticImages([image('hash200', 200)]);
		const { hash, ...hash100 } = image('hash100', 100);
		const list: AssetsGlobalStaticImagesList = new Map([
			[
				originalPath,
				{ originalSrcPath: hash100.originalSrcPath, transforms: new Map([[hash, hash100]]) },
			],
			[
				'/_astro/other.png',
				{ originalSrcPath: '/src/assets/other.png', transforms: new Map([[hash, hash100]]) },
			],
		]);
		registry.addStaticImageList(list);

		assert.deepEqual(
			[...registry.images.get(originalPath)!.transforms.keys()],
			['hash200', 'hash100'],
		);
		assert.equal(registry.images.get('/_astro/other.png')?.transforms.size, 1);
	});
});
