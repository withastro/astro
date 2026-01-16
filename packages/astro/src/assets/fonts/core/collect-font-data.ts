import type { FontData, FontDataByCssVariable, FontFamilyAssets } from '../types.js';
import { renderFontWeight } from '../utils.js';

export function collectFontData(
	fontFamilyAssets: Array<Pick<FontFamilyAssets, 'fonts' | 'family'>>,
) {
	const fontDataByCssVariable: FontDataByCssVariable = new Map();

	for (const { family, fonts } of fontFamilyAssets) {
		const fontData: Array<FontData> = [];
		for (const data of fonts) {
			fontData.push({
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

		fontDataByCssVariable.set(family.cssVariable, fontData);
	}

	return fontDataByCssVariable;
}
