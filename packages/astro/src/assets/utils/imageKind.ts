import type { ImageMetadata } from '../types.js';

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}

export function isRemoteImage(src: ImageMetadata | string): src is string {
	return typeof src === 'string';
}
