import type { PreloadData, PreloadFilter } from '../types.js';

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
		preload.some((p) => {
			// Always check the weight
			if (
				p.weight !== undefined &&
				weight !== undefined &&
				!checkWeight(p.weight.toString(), weight)
			) {
				return false;
			}
			// Only check the style if specified
			if (p.style !== undefined && p.style !== style) {
				return false;
			}
			// Only check the subset if specified
			if (p.subset !== undefined && p.subset !== subset) {
				return false;
			}
			return true;
		}),
	);
}

function checkWeight(input: string, target: string): boolean {
	const trimmedInput = input.trim();
	const trimmedTarget = target.trim();
	if (trimmedInput === trimmedTarget) {
		return true;
	}
	// A weight like "400" or a range like "400 700" matches a file whose range contains it, e.g. "100 900"
	const [inputMin, inputMax] = parseWeightRange(trimmedInput);
	const [targetMin, targetMax] = parseWeightRange(trimmedTarget);
	return inputMin >= targetMin && inputMax <= targetMax;
}

function parseWeightRange(weight: string): [number, number] {
	const [min, max = min] = weight.split(/\s+/).map((value) => Number.parseFloat(value));
	return [min, max];
}
