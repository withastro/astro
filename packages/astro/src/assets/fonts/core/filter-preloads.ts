<<<<<<<< HEAD:packages/astro/src/assets/fonts/core/filter-preloads.ts
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
========
import * as fontsMod from 'virtual:astro:assets/fonts/internal';

// TODO: remove default when stabilizing
export const fontData = fontsMod.fontDataByCssVariable ?? {};
>>>>>>>> main:packages/astro/src/assets/fonts/runtime.ts
