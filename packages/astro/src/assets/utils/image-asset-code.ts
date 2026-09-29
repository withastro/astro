import type { ImageMetadata } from '../types.js';

/** Local name of `createImageAsset` in generated modules. */
const CREATE_IMAGE_ASSET = '__astro_createImageAsset';

/** Imports the runtime of generated image modules. See `./image-asset.ts`. */
export const IMAGE_ASSET_IMPORT = `import { createImageAsset as ${CREATE_IMAGE_ASSET} } from "astro/assets/image-asset";`;

/**
 * Generates an expression creating the server-side value of an image import. Modules using it
 * must include {@link IMAGE_ASSET_IMPORT}.
 *
 * @param track Record reads of `src` as references to the original file. Unnecessary where every
 *   image is already considered referenced (on-demand rendered environments).
 */
export function getImageAssetCode(metadata: ImageMetadata, track: boolean): string {
	return `${CREATE_IMAGE_ASSET}(${JSON.stringify(metadata)}, ${JSON.stringify(metadata.fsPath)}, ${track})`;
}

/** Generates a module whose default export is the server-side value of an image import. */
export function getImageAssetModule(metadata: ImageMetadata, track: boolean): string {
	return `${IMAGE_ASSET_IMPORT}\nexport default ${getImageAssetCode(metadata, track)};`;
}

/** Whether generated code uses {@link getImageAssetCode}, and so needs {@link IMAGE_ASSET_IMPORT}. */
export function usesImageAsset(code: string): boolean {
	return code.includes(CREATE_IMAGE_ASSET);
}
