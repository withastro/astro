import type { TextStyler } from '../definitions.js';

export function createPassthroughTextStyler(): TextStyler {
	return {
		bgWhite: (msg) => msg,
		black: (msg) => msg,
		dim: (msg) => msg,
		green: (msg) => msg,
		bold: (msg) => msg,
		bgGreen: (msg) => msg,
	};
}
