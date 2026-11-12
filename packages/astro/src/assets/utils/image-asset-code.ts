import type { JavaScriptFragment, JavaScriptTag } from 'devalue';
import type { ImageMetadata } from '../types.js';

export const IMAGE_ASSET_IMPORT = `import { createImageAsset as __astro_createImageAsset } from "astro/assets/image-asset";`;

// Callers must also emit IMAGE_ASSET_IMPORT.
export function getImageAssetCode(
	js: JavaScriptTag,
	metadata: Omit<ImageMetadata, 'fsPath'>,
	fsPath: string,
	track: boolean,
): JavaScriptFragment {
	return js`__astro_createImageAsset(${metadata}, ${fsPath}, ${track})`;
}

export function getImageAssetModule(
	metadata: Omit<ImageMetadata, 'fsPath'>,
	fsPath: string,
	track: boolean,
): string {
	return `${IMAGE_ASSET_IMPORT}\nexport default __astro_createImageAsset(${JSON.stringify(metadata)}, ${JSON.stringify(fsPath)}, ${track});`;
}
