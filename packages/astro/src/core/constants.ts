// process.env.PACKAGE_VERSION is injected when we build and publish the astro package.
export const ASTRO_VERSION = process.env.PACKAGE_VERSION ?? 'development';

// possible extensions for markdown files
export const SUPPORTED_MARKDOWN_FILE_EXTENSIONS = [
	'.markdown',
	'.mdown',
	'.mkdn',
	'.mkd',
	'.mdwn',
	'.md',
] as const;
