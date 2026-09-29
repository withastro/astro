import type { ImageMetadata } from '../types.js';

const CREATE_IMAGE_ASSET = '__astro_createImageAsset';

export const IMAGE_ASSET_IMPORT = `import { createImageAsset as ${CREATE_IMAGE_ASSET} } from "astro/assets/image-asset";`;

// Callers must also emit IMAGE_ASSET_IMPORT.
export function getImageAssetCode(metadata: ImageMetadata, track: boolean): string {
	return `${CREATE_IMAGE_ASSET}(${JSON.stringify(metadata)}, ${JSON.stringify(metadata.fsPath)}, ${track})`;
}

export function getImageAssetModule(metadata: ImageMetadata, track: boolean): string {
	return `${IMAGE_ASSET_IMPORT}\nexport default ${getImageAssetCode(metadata, track)};`;
}

export function usesImageAsset(code: string): boolean {
	return code.includes(CREATE_IMAGE_ASSET);
}
