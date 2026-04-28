export const VIRTUAL_MODULE_ID = 'astro:assets';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
export const VIRTUAL_SERVICE_ID = 'virtual:image-service';
// Internal virtual module that exports only getImage (no component references).
// Used by the content runtime to avoid a TDZ when Picture/Image are in the same chunk.
export const VIRTUAL_GET_IMAGE_ID = 'virtual:astro:get-image';
export const RESOLVED_VIRTUAL_GET_IMAGE_ID = '\0' + VIRTUAL_GET_IMAGE_ID;
// Must keep the extension so we trigger the pipeline of CSS files
export const VIRTUAL_IMAGE_STYLES_ID = 'virtual:astro:image-styles.css';
export const RESOLVED_VIRTUAL_IMAGE_STYLES_ID = '\0' + VIRTUAL_IMAGE_STYLES_ID;
export const VALID_INPUT_FORMATS = [
	'jpeg',
	'jpg',
	'png',
	'tiff',
	'webp',
	'gif',
	'svg',
	'avif',
] as const;
/**
 * Valid formats that our base services support.
 * Certain formats can be imported (namely SVGs) but will not be processed.
 */
export const VALID_SUPPORTED_FORMATS = [
	'jpeg',
	'jpg',
	'png',
	'tiff',
	'webp',
	'gif',
	'svg',
	'avif',
] as const;
export const DEFAULT_OUTPUT_FORMAT = 'webp' as const;
export const VALID_OUTPUT_FORMATS = ['avif', 'png', 'webp', 'jpeg', 'jpg', 'svg'] as const;
export const DEFAULT_HASH_PROPS = [
	'src',
	'width',
	'height',
	'format',
	'quality',
	'fit',
	'position',
	'background',
];
