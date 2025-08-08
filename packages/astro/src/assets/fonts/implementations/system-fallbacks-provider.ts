import type { SystemFallbacksProvider } from '../definitions.js';
import type { FontFaceMetrics, GenericFallbackName } from '../types.js';

// Extracted from https://raw.githubusercontent.com/seek-oss/capsize/refs/heads/master/packages/metrics/src/entireMetricsCollection.json
const SYSTEM_METRICS = {
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

type FallbackName = keyof typeof SYSTEM_METRICS;

// Source: https://github.com/nuxt/fonts/blob/3a3eb6dfecc472242b3011b25f3fcbae237d0acc/src/module.ts#L55-L75
export const DEFAULT_FALLBACKS = {
	serif: ['Times New Roman'],
	'sans-serif': ['Arial'],
	monospace: ['Courier New'],
	'system-ui': ['BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
	'ui-serif': ['Times New Roman'],
	'ui-sans-serif': ['Arial'],
	'ui-monospace': ['Courier New'],
} satisfies Partial<Record<GenericFallbackName, Array<FallbackName>>>;

export function createSystemFallbacksProvider(): SystemFallbacksProvider {
	return {
		getLocalFonts(fallback) {
			return DEFAULT_FALLBACKS[fallback as keyof typeof DEFAULT_FALLBACKS] ?? null;
		},
		getMetricsForLocalFont(family) {
			return SYSTEM_METRICS[family as FallbackName];
		},
	};
}
