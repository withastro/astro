// Imported by every generated image module: keep it free of `node:` and server runtime imports.
import { recordReferencedImage } from '../../core/render-scope/record.js';
import type { ImageMetadata } from '../types.js';

const RAW_SRC = Symbol.for('astro:image-asset:raw-src');

type ImageAsset = ImageMetadata & { readonly [RAW_SRC]: string };

// The build keeps an original image only if its `src` is read outside of image optimization.
export function createImageAsset<T extends Omit<ImageMetadata, 'fsPath'>>(
	metadata: T,
	fsPath: string,
	track: boolean,
): T & ImageMetadata {
	const asset = { ...metadata } as unknown as ImageAsset;
	Object.defineProperty(asset, 'fsPath', { value: fsPath, enumerable: false });
	if (track) {
		let src = metadata.src;
		Object.defineProperty(asset, RAW_SRC, { get: () => src });
		Object.defineProperty(asset, 'src', {
			enumerable: true,
			configurable: true,
			get() {
				recordReferencedImage(fsPath);
				return src;
			},
			set(value: string) {
				src = value;
			},
		});
	} else {
		Object.defineProperty(asset, RAW_SRC, { get: () => asset.src });
	}
	return asset as unknown as T & ImageMetadata;
}

export function getUntrackedImage<T>(image: T): T {
	if (typeof image !== 'object' || image === null || !(RAW_SRC in image)) {
		return image;
	}
	const asset = image as unknown as ImageAsset;
	const copy: Record<string, unknown> = {};
	for (const key of Object.keys(asset)) {
		copy[key] = key === 'src' ? asset[RAW_SRC] : asset[key as keyof ImageMetadata];
	}
	Object.defineProperty(copy, 'fsPath', { value: asset.fsPath, enumerable: false });
	return copy as T;
}
