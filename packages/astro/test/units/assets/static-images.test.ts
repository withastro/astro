import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { getImage, setConfiguredImageService } from '../../../dist/assets/internal.js';
import { baseService } from '../../../dist/assets/services/service.js';
import { isImageMetadata } from '../../../dist/assets/types.js';
import type { ImageMetadata } from '../../../dist/assets/types.js';
import { createImageAsset, getUntrackedImage } from '../../../dist/assets/utils/image-asset.js';
import { resolveStaticImage } from '../../../dist/assets/utils/static-image.js';
import { ensureAsyncRenderScope } from '../../../dist/core/render-scope/node-scope.js';
import {
	drainAmbientCollectors,
	type RenderCollectors,
	uninstallRenderScope,
} from '../../../dist/core/render-scope/scope.js';
import { mockRuntimeLogger } from '../mocks.ts';

const fsPath = '/project/src/assets/photo.png';
const metadata = {
	src: '/_astro/photo.abc123.png',
	width: 1000,
	height: 800,
	format: 'png' as const,
};

function newStore(): RenderCollectors {
	return { contentEntries: new Set(), staticImages: [], referencedImages: new Set() };
}

describe('resolveStaticImage', () => {
	const esmImage = createImageAsset(metadata, fsPath, false);
	const options = { base: '/', assetsDir: '_astro', serviceEntrypoint: 'test' };

	it('resolves an ESM image next to its original', () => {
		const { url, image } = resolveStaticImage(
			{ src: getUntrackedImage(esmImage), width: 200, format: 'webp' },
			['src', 'width', 'format'],
			fsPath,
			options,
		);
		assert.match(image.finalPath, /^\/_astro\/photo\.abc123_\w+\.webp$/);
		assert.equal(url, image.finalPath);
		assert.equal(image.originalPath, '/_astro/photo.abc123.png');
		assert.equal(image.originalSrcPath, fsPath);
	});

	it('keeps the file names of earlier releases', () => {
		const { image } = resolveStaticImage(
			{ src: getUntrackedImage(esmImage), width: 200, format: 'webp' },
			['src', 'width', 'format'],
			fsPath,
			options,
		);
		assert.equal(image.hash, '15opUF');
		assert.equal(image.finalPath, '/_astro/photo.abc123_15opUF.webp');
	});

	it('resolves string sources in the assets directory', () => {
		const { image } = resolveStaticImage(
			{ src: 'https://example.com/photo.jpg', width: 200, format: 'webp' },
			['src', 'width', 'format'],
			undefined,
			options,
		);
		assert.match(image.finalPath, /^\/_astro\/photo_\w+\.webp$/);
	});

	it('prefixes URLs with the base, or the assets prefix', () => {
		const transform = { src: getUntrackedImage(esmImage), width: 200, format: 'webp' };
		const withBase = resolveStaticImage(transform, ['width'], fsPath, {
			...options,
			base: '/docs/',
		});
		assert.equal(withBase.url, `/docs${withBase.image.finalPath}`);

		const withPrefix = resolveStaticImage(transform, ['width'], fsPath, {
			...options,
			assetsPrefix: { png: 'https://png.cdn.com', fallback: 'https://cdn.com' },
		});
		assert.equal(withPrefix.url, `https://png.cdn.com${withPrefix.image.finalPath}`);
	});

	it('appends asset query params', () => {
		const { url } = resolveStaticImage(
			{ src: getUntrackedImage(esmImage), width: 200, format: 'webp' },
			['width'],
			fsPath,
			{ ...options, assetQueryParams: new URLSearchParams({ dpl: '123' }) },
		);
		assert.match(url, /\.webp\?dpl=123$/);
	});
});

describe('createImageAsset', () => {
	afterEach(() => {
		uninstallRenderScope();
	});

	it('records reads of src against the rendering page', () => {
		const scope = ensureAsyncRenderScope();
		const image = createImageAsset(metadata, fsPath, true);
		const store = newStore();
		scope.run(store, () => {
			assert.equal(image.width, 1000);
			assert.equal(getUntrackedImage(image).src, metadata.src);
			assert.equal(store.referencedImages!.size, 0, 'only reading src is a reference');
			assert.equal(image.src, metadata.src);
		});
		assert.deepEqual([...store.referencedImages!], [fsPath]);
	});

	it('records reads of src outside of a render into the ambient store', () => {
		ensureAsyncRenderScope();
		const image = createImageAsset(metadata, fsPath, true);
		void image.src;
		assert.deepEqual(drainAmbientCollectors().referencedImages, [fsPath]);
	});

	it('does not record when untracked', () => {
		ensureAsyncRenderScope();
		const image = createImageAsset(metadata, fsPath, false);
		void image.src;
		assert.deepEqual(drainAmbientCollectors().referencedImages, []);
	});

	it('is a plain value: can be cloned and serialized, without its fsPath', () => {
		const image = createImageAsset(metadata, fsPath, true);
		assert.deepEqual(structuredClone(image), metadata);
		assert.deepEqual(JSON.parse(JSON.stringify(image)), metadata);
		assert.deepEqual({ ...image }, metadata);
		assert.equal((image as any).fsPath, fsPath);
		assert.equal((getUntrackedImage(image) as any).fsPath, fsPath);
	});

	it('is detected as an ESM image', () => {
		assert.equal(isImageMetadata(createImageAsset(metadata, fsPath, true)), true);
		assert.equal(isImageMetadata({ ...metadata }), false);
	});

	it('allows assigning src', () => {
		const image = createImageAsset(metadata, fsPath, true);
		image.src = '/other.png';
		assert.equal(image.src, '/other.png');
		assert.equal(getUntrackedImage(image).src, '/other.png');
	});

	it('returns a fresh untracked copy that reflects changes to the image', () => {
		const image = createImageAsset(metadata, fsPath, true);
		image.width = 5;
		const copy = getUntrackedImage(image);
		assert.equal(copy.width, 5);
		copy.width = 10;
		assert.equal(getUntrackedImage(image).width, 5);
	});
});

describe('getImage static images', () => {
	const localService = {
		...baseService,
		getURL: (options: { src: string | ImageMetadata }) =>
			`/_image?href=${typeof options.src === 'string' ? options.src : options.src.src}`,
		async transform() {
			return { data: new Uint8Array(), format: 'webp' };
		},
	};
	const imageConfig = {
		service: { entrypoint: 'test', config: {} },
		domains: [],
		remotePatterns: [],
		endpoint: { route: '/_image' },
		dangerouslyProcessSVG: false,
		responsiveStyles: false,
	} as any;

	beforeEach(() => {
		setConfiguredImageService(localService as any);
	});

	afterEach(() => {
		setConfiguredImageService(undefined);
		uninstallRenderScope();
	});

	it('returns on-demand URLs when not prerendering', async () => {
		const image = createImageAsset(metadata, fsPath, true);
		const result = await getImage({ src: image, width: 200 }, imageConfig, mockRuntimeLogger);
		assert.ok(result.src.startsWith('/_image'));
	});

	it('resolves static files and reports them against the rendering page', async () => {
		const scope = ensureAsyncRenderScope({ staticImages: { base: '/', assetsDir: '_astro' } });
		const image = createImageAsset(metadata, fsPath, true);
		const store = newStore();
		// `src` resolves lazily, when the page reads it.
		const src = await scope.run(store, async () => {
			const result = await getImage({ src: image, width: 200 }, imageConfig, mockRuntimeLogger);
			return result.src;
		});
		assert.match(src, /^\/_astro\/photo\.abc123_\w+\.webp$/);
		assert.equal(store.staticImages!.length, 1);
		assert.equal(store.staticImages![0].finalPath, src);
		assert.equal(store.staticImages![0].originalSrcPath, fsPath);
		assert.equal(
			store.referencedImages!.size,
			0,
			'optimizing an image does not reference its original',
		);
	});

	it('reports static files resolved outside of a render into the ambient store', async () => {
		ensureAsyncRenderScope({ staticImages: { base: '/', assetsDir: '_astro' } });
		const image = createImageAsset(metadata, fsPath, true);
		const { src } = await getImage({ src: image, width: 200 }, imageConfig, mockRuntimeLogger);
		const { staticImages, referencedImages } = drainAmbientCollectors();
		assert.deepEqual(
			staticImages.map((i) => i.finalPath),
			[src],
		);
		assert.deepEqual(referencedImages, []);
	});
});
