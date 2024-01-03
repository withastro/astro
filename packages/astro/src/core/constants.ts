import type { AstroIntegrationBuiltinHooks } from "../@types/astro.js";

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

// The folder name where to find the middleware
export const MIDDLEWARE_PATH_SEGMENT_NAME = 'middleware';

export const BUILTIN_INTEGRATION_HOOKS = [
	'astro:config:setup',
	'astro:config:done',
	'astro:server:setup',
	'astro:server:start',
	'astro:server:done',
	'astro:build:ssr',
	'astro:build:start',
	'astro:build:setup',
	'astro:build:generated',
	'astro:build:done',
] satisfies (keyof AstroIntegrationBuiltinHooks)[];