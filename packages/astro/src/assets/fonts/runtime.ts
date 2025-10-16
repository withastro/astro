import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { ConsumableMap, PreloadData, PreloadFilter } from './types.js';

export function createGetFontData({ consumableMap }: { consumableMap?: ConsumableMap }) {
	return function getFontData(cssVariable: string) {
		if (!consumableMap) {
			throw new AstroError(AstroErrorData.ExperimentalFontsNotEnabled);
		}
		const data = consumableMap.get(cssVariable);
		if (!data) {
			throw new AstroError({
				...AstroErrorData.FontFamilyNotFound,
				message: AstroErrorData.FontFamilyNotFound.message(cssVariable),
			});
		}
		return data;
	};
}

export function filterPreloads(
	data: Array<PreloadData>,
	preload: PreloadFilter,
): Array<PreloadData> | null {
	if (!preload) {
		return null;
	}
	if (preload === true) {
		// Preload everything
		return data;
	}
	// Only preload urls based on weight, style and subset
	return data.filter(({ weight, style, subset }) =>
		preload.some(
			(p) =>
				// Always check the weight
				(!p.weight || p.weight.toString() === weight) &&
				// Only check the style if specified
				(!p.style || p.style === style) &&
				// Only check the subset if specified
				(p!.subset || p.subset === subset),
		),
	);
}
