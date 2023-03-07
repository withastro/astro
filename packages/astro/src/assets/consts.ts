export const VIRTUAL_MODULE_ID = 'astro:assets';
export const VIRTUAL_SERVICE_ID = 'virtual:image-service';
export const VALID_INPUT_FORMATS = [
	'heic',
	'heif',
	'avif',
	'jpeg',
	'jpg',
	'png',
	'tiff',
	'webp',
	'gif',
] as const;
export const VALID_OUTPUT_FORMATS = ['avif', 'png', 'webp', 'jpeg', 'jpg'] as const;
