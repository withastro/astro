import type { Defaults, FontType } from './types.js';

export const LOCAL_PROVIDER_NAME = 'local';

export const DEFAULTS: Defaults = {
	weights: ['400'],
	styles: ['normal', 'italic'],
	subsets: ['cyrillic-ext', 'cyrillic', 'greek-ext', 'greek', 'vietnamese', 'latin-ext', 'latin'],
	// Technically serif is the browser default but most websites these days use sans-serif
	fallbacks: ['sans-serif'],
	optimizedFallbacks: true,
};

/** Used to serialize data, to be used by public APIs */
export const VIRTUAL_MODULE_ID = 'virtual:astro:assets/fonts/internal';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export const ASSETS_DIR = 'fonts';
export const CACHE_DIR = './fonts/';

export const FONT_TYPES = ['woff2', 'woff', 'otf', 'ttf', 'eot'] as const;

export const FONT_FORMATS: Array<{ type: FontType; format: string }> = [
	{ type: 'woff2', format: 'woff2' },
	{ type: 'woff', format: 'woff' },
	{ type: 'otf', format: 'opentype' },
	{ type: 'ttf', format: 'truetype' },
	{ type: 'eot', format: 'embedded-opentype' },
];

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
