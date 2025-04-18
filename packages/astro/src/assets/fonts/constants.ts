import type { Defaults } from "./types.js";

export const LOCAL_PROVIDER_NAME = 'local';

export const DEFAULTS: Defaults = {
	weights: ['400'],
	styles: ['normal', 'italic'],
	subsets: ['cyrillic-ext', 'cyrillic', 'greek-ext', 'greek', 'vietnamese', 'latin-ext', 'latin'],
	// Technically serif is the browser default but most websites these days use sans-serif
	fallbacks: ['sans-serif'],
	optimizedFallbacks: true,
};

export const VIRTUAL_MODULE_ID = 'virtual:astro:assets/fonts/internal';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

// Requires a trailing slash
export const URL_PREFIX = '/_astro/fonts/';
export const CACHE_DIR = './fonts/';

export const FONT_TYPES = ['woff2', 'woff', 'otf', 'ttf', 'eot'] as const;
export const FONT_FORMAT_MAP: Record<(typeof FONT_TYPES)[number], string> = {
	woff2: 'woff2',
	woff: 'woff',
	otf: 'opentype',
	ttf: 'truetype',
	eot: 'embedded-opentype',
};

export const GENERIC_FALLBACK_NAMES = [
	'serif',
	'sans-serif',
	'monospace',
	'cursive',
	'fantasy',
	'system-ui',
	'ui-serif',
	'ui-sans-serif',
	'ui-monospace',
	'ui-rounded',
	'emoji',
	'math',
	'fangsong',
] as const;

export const FONTS_TYPES_FILE = 'fonts.d.ts';
