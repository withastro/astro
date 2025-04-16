import type { FontFaceMetrics } from './metrics.js';
import type { ResolvedRemoteFontFamily } from './types.js';

export const LOCAL_PROVIDER_NAME = 'local';

export const DEFAULTS = {
	weights: ['400'],
	styles: ['normal', 'italic'],
	subsets: ['cyrillic-ext', 'cyrillic', 'greek-ext', 'greek', 'vietnamese', 'latin-ext', 'latin'],
	// Technically serif is the browser default but most websites these days use sans-serif
	fallbacks: ['sans-serif'],
	optimizedFallbacks: true,
} satisfies Partial<ResolvedRemoteFontFamily>;

export const VIRTUAL_MODULE_ID = 'virtual:astro:assets/fonts/internal';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

// Requires a trailing slash
export const URL_PREFIX = '/_astro/fonts/';
export const CACHE_DIR = './fonts/';

export const FONT_TYPES = ['woff2', 'woff', 'otf', 'ttf', 'eot'] as const;

// Extracted from https://raw.githubusercontent.com/seek-oss/capsize/refs/heads/master/packages/metrics/src/entireMetricsCollection.json
export const SYSTEM_METRICS = {
	'Times New Roman': {
		ascent: 1825,
		descent: -443,
		lineGap: 87,
		unitsPerEm: 2048,
		xWidthAvg: 832,
	},
	Arial: {
		ascent: 1854,
		descent: -434,
		lineGap: 67,
		unitsPerEm: 2048,
		xWidthAvg: 913,
	},
	'Courier New': {
		ascent: 1705,
		descent: -615,
		lineGap: 0,
		unitsPerEm: 2048,
		xWidthAvg: 1229,
	},
	BlinkMacSystemFont: {
		ascent: 1980,
		descent: -432,
		lineGap: 0,
		unitsPerEm: 2048,
		xWidthAvg: 853,
	},
	'Segoe UI': {
		ascent: 2210,
		descent: -514,
		lineGap: 0,
		unitsPerEm: 2048,
		xWidthAvg: 908,
	},
	Roboto: {
		ascent: 1900,
		descent: -500,
		lineGap: 0,
		unitsPerEm: 2048,
		xWidthAvg: 911,
	},
	'Helvetica Neue': {
		ascent: 952,
		descent: -213,
		lineGap: 28,
		unitsPerEm: 1000,
		xWidthAvg: 450,
	},
} satisfies Record<string, FontFaceMetrics>;

// Keep up to date with system metrics data
// Source: https://github.com/nuxt/fonts/blob/3a3eb6dfecc472242b3011b25f3fcbae237d0acc/src/module.ts#L55-L75
export const DEFAULT_FALLBACKS = {
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
} as const satisfies Record<string, Array<keyof typeof SYSTEM_METRICS>>;

export const FONTS_TYPES_FILE = 'fonts.d.ts';
