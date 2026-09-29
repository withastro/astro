// Imported by every generated image module: keep it free of `node:` and server runtime imports.
import { recordReferencedImage } from '../../core/render-scope/record.js';
import type { ImageMetadata } from '../types.js';

const UNTRACKED = Symbol.for('astro:image-asset:untracked');

type ImageAsset = ImageMetadata & { [UNTRACKED]?: ImageMetadata };

// The build keeps an original image only if its `src` is read outside of image optimization.
export function createImageAsset<T extends Omit<ImageMetadata, 'fsPath'>>(
	metadata: T,
	fsPath: string,
	track: boolean,
): T & ImageMetadata {
	const untracked = { ...metadata } as unknown as ImageMetadata;
	if (!Object.hasOwn(untracked, 'fsPath')) {
		Object.defineProperty(untracked, 'fsPath', { value: fsPath, enumerable: false });
	}

	const asset = { ...untracked } as ImageAsset;
	if (!Object.hasOwn(asset, 'fsPath')) {
		Object.defineProperty(asset, 'fsPath', { value: fsPath, enumerable: false });
	}
	Object.defineProperty(asset, UNTRACKED, { value: untracked, enumerable: false });
	if (track) {
		const src = metadata.src;
		Object.defineProperty(asset, 'src', {
			enumerable: true,
			configurable: true,
			get() {
				recordReferencedImage(fsPath);
				return src;
			},
		});
	}
	return asset as T & ImageMetadata;
}

export function getUntrackedImage<T>(image: T): T {
	if (typeof image === 'object' && image !== null) {
		return ((image as Partial<ImageAsset>)[UNTRACKED] as T | undefined) ?? image;
	}
	return image;
}
