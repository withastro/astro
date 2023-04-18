export const VIRTUAL_MODULE_ID = 'astro:assets';
export const VIRTUAL_SERVICE_ID = 'virtual:image-service';
export const VALID_INPUT_FORMATS = [
	// TODO: `image-size` does not support the following formats, so users can't import them.
	// However, it would be immensely useful to add, for three reasons:
	// - `heic` and `heif` are common formats, especially among Apple users.
	// - AVIF is a common format on the web that's bound to become more and more common.
	// - It's totally reasonable for an user's provided image service to want to support more image types.
	//'heic',
	//'heif',
	//'avif',
	'jpeg',
	'jpg',
	'png',
	'tiff',
	'webp',
	'gif',
	'svg',
] as const;
/**
 * Valid formats for optimizations in our base services.
 * Certain formats can be imported (namely SVGs) but not processed, so they are excluded from this list.
 */
export const VALID_OPTIMIZABLE_FORMATS = ['jpeg', 'jpg', 'png', 'tiff', 'webp', 'gif'] as const;
export const VALID_OUTPUT_FORMATS = ['avif', 'png', 'webp', 'jpeg', 'jpg'] as const;
