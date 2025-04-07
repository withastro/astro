import type { ResolvedRemoteFontFamily } from './types.js';

export const LOCAL_PROVIDER_NAME = 'local';

export const DEFAULTS = {
	weights: ['400'],
	styles: ['normal', 'italic'],
	subsets: ['cyrillic-ext', 'cyrillic', 'greek-ext', 'greek', 'vietnamese', 'latin-ext', 'latin'],
	// Technically serif is the browser default but most websites these days use sans-serif
	fallbacks: ['sans-serif'],
	automaticFallback: true,
} satisfies Partial<ResolvedRemoteFontFamily>;

export const VIRTUAL_MODULE_ID = 'virtual:astro:assets/fonts/internal';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

// Requires a trailing slash
export const URL_PREFIX = '/_astro/fonts/';
export const CACHE_DIR = './fonts/';

export const FONT_TYPES = ['woff2', 'woff', 'otf', 'ttf', 'eot'] as const;

// Source: https://github.com/nuxt/fonts/blob/3a3eb6dfecc472242b3011b25f3fcbae237d0acc/src/module.ts#L55-L75
export const DEFAULT_FALLBACKS: Record<string, Array<string>> = {
	serif: ['Times New Roman'],
	'sans-serif': ['Arial'],
	monospace: ['Courier New'],
	cursive: [],
	fantasy: [],
	'system-ui': ['BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
	'ui-serif': ['Times New Roman'],
	'ui-sans-serif': ['Arial'],
	'ui-monospace': ['Courier New'],
	'ui-rounded': [],
	emoji: [],
	math: [],
	fangsong: [],
};

export const FONTS_TYPES_FILE = 'fonts.d.ts';
