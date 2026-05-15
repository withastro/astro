const VIRTUAL_MODULE_ID = 'astro:assets';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const VIRTUAL_SERVICE_ID = 'virtual:image-service';
const VIRTUAL_GET_IMAGE_ID = 'virtual:astro:get-image';
const RESOLVED_VIRTUAL_GET_IMAGE_ID = '\0' + VIRTUAL_GET_IMAGE_ID;
const VIRTUAL_IMAGE_STYLES_ID = 'virtual:astro:image-styles.css';
const RESOLVED_VIRTUAL_IMAGE_STYLES_ID = '\0' + VIRTUAL_IMAGE_STYLES_ID;
const VALID_INPUT_FORMATS = ['jpeg', 'jpg', 'png', 'tiff', 'webp', 'gif', 'svg', 'avif'];
const VALID_SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'tiff', 'webp', 'gif', 'svg', 'avif'];
const DEFAULT_OUTPUT_FORMAT = 'webp';
const VALID_OUTPUT_FORMATS = ['avif', 'png', 'webp', 'jpeg', 'jpg', 'svg'];
const DEFAULT_HASH_PROPS = [
	'src',
	'width',
	'height',
	'format',
	'quality',
	'fit',
	'position',
	'background',
];
export {
	DEFAULT_HASH_PROPS,
	DEFAULT_OUTPUT_FORMAT,
	RESOLVED_VIRTUAL_GET_IMAGE_ID,
	RESOLVED_VIRTUAL_IMAGE_STYLES_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	VALID_INPUT_FORMATS,
	VALID_OUTPUT_FORMATS,
	VALID_SUPPORTED_FORMATS,
	VIRTUAL_GET_IMAGE_ID,
	VIRTUAL_IMAGE_STYLES_ID,
	VIRTUAL_MODULE_ID,
	VIRTUAL_SERVICE_ID,
};
