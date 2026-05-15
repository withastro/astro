export declare const VIRTUAL_MODULE_ID = 'astro:assets';
export declare const RESOLVED_VIRTUAL_MODULE_ID: string;
export declare const VIRTUAL_SERVICE_ID = 'virtual:image-service';
export declare const VIRTUAL_GET_IMAGE_ID = 'virtual:astro:get-image';
export declare const RESOLVED_VIRTUAL_GET_IMAGE_ID: string;
export declare const VIRTUAL_IMAGE_STYLES_ID = 'virtual:astro:image-styles.css';
export declare const RESOLVED_VIRTUAL_IMAGE_STYLES_ID: string;
export declare const VALID_INPUT_FORMATS: readonly [
	'jpeg',
	'jpg',
	'png',
	'tiff',
	'webp',
	'gif',
	'svg',
	'avif',
];
/**
 * Valid formats that our base services support.
 * Certain formats can be imported (namely SVGs) but will not be processed.
 */
export declare const VALID_SUPPORTED_FORMATS: readonly [
	'jpeg',
	'jpg',
	'png',
	'tiff',
	'webp',
	'gif',
	'svg',
	'avif',
];
export declare const DEFAULT_OUTPUT_FORMAT: 'webp';
export declare const VALID_OUTPUT_FORMATS: readonly ['avif', 'png', 'webp', 'jpeg', 'jpg', 'svg'];
export declare const DEFAULT_HASH_PROPS: string[];
