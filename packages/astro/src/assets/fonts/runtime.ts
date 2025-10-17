import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { ConsumableMap, PreloadData, PreloadFilter } from './types.js';

export function createGetFontData({ consumableMap }: { consumableMap?: ConsumableMap }) {
	return function getFontData(cssVariable: string) {
		// TODO: remove once fonts are stabilized
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
				(p.weight === undefined ||
					weight === undefined ||
					checkWeight(p.weight.toString(), weight)) &&
				// Only check the style if specified
				(p.style === undefined || p.style === style) &&
				// Only check the subset if specified
				(p.subset === undefined || p.subset === subset),
		),
	);
}

function checkWeight(input: string, target: string): boolean {
	// If the input looks like "100 900", we check it as is
	const trimmedInput = input.trim();
	if (trimmedInput.includes(' ')) {
		return trimmedInput === target;
	}
	// If the target looks like "100 900", we check if the input is between the values
	if (target.includes(' ')) {
		const [a, b] = target.split(' ');
		const parsedInput = Number.parseInt(input);
		return parsedInput >= Number.parseInt(a) && parsedInput <= Number.parseInt(b);
	}
	return input === target;
}
