/**
 * Runtime for image modules (`import img from './img.png'`) on the server.
 *
 * This module is imported by the code generated for every image import, so it
 * must stay a leaf: no server runtime, no `node:` imports.
 */
import { recordReferencedImage } from '../../core/render-scope/record.js';
import type { ImageMetadata } from '../types.js';

const UNTRACKED = Symbol.for('astro:image-asset:untracked');

type ImageAsset = ImageMetadata & { [UNTRACKED]?: ImageMetadata };

/**
 * Creates the object an image module exports.
 *
 * The original file of an image is only kept in the build output if something
 * uses its URL outside of image optimization (e.g. `<img src={img.src}>`). With
 * `track`, reading `src` records the reference against the page rendering (see
 * `core/render-scope`). The result is a plain object: it can be cloned and
 * serialized like any other value, which reads `src` and so, correctly, counts
 * as a reference.
 *
 * `fsPath` is internal: it is non-enumerable unless the metadata already
 * carried it as a regular property.
 */
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

/**
 * Returns a copy of an image asset whose properties can be read without
 * counting as a reference to the original file. Used by image optimization,
 * which only needs the original to generate its transforms. Returns any other
 * value as is.
 */
export function getUntrackedImage<T>(image: T): T {
	if (typeof image === 'object' && image !== null) {
		return ((image as Partial<ImageAsset>)[UNTRACKED] as T | undefined) ?? image;
	}
	return image;
}
