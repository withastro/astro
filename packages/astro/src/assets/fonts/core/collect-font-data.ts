import type { FontData, FontDataByCssVariable, FontFamilyAssets } from '../types.js';
import { renderFontWeight } from '../utils.js';

export function collectFontData(
	fontFamilyAssets: Array<Pick<FontFamilyAssets, 'fonts' | 'family'>>,
) {
	const fontDataByCssVariable: FontDataByCssVariable = new Map();

	for (const { family, fonts } of fontFamilyAssets) {
		const consumableMapValue: Array<FontData> = [];
		for (const data of fonts) {
			consumableMapValue.push({
				weight: renderFontWeight(data.weight),
				style: data.style,
				src: data.src
					.filter((src) => 'url' in src)
					.map((src) => ({
						url: src.url,
						format: src.format,
						tech: src.tech,
					})),
			});
		}

		fontDataByCssVariable.set(family.cssVariable, consumableMapValue);
	}

	return { fontDataByCssVariable };
}
