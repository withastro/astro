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
		unitsPerEm: 1e3,
		xWidthAvg: 450,
	},
};
const DEFAULT_FALLBACKS = {
	serif: ['Times New Roman'],
	'sans-serif': ['Arial'],
	monospace: ['Courier New'],
	'system-ui': ['BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
	'ui-serif': ['Times New Roman'],
	'ui-sans-serif': ['Arial'],
	'ui-monospace': ['Courier New'],
};
class RealSystemFallbacksProvider {
	getLocalFonts(fallback) {
		return DEFAULT_FALLBACKS[fallback] ?? null;
	}
	getMetricsForLocalFont(family) {
		return SYSTEM_METRICS[family];
	}
}
export { RealSystemFallbacksProvider };
