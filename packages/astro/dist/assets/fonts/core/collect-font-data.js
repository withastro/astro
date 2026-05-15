import { renderFontWeight } from '../utils.js';
function collectFontData(fontFamilyAssets) {
	const fontDataByCssVariable = {};
	for (const { family, fonts } of fontFamilyAssets) {
		const fontData = [];
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
		fontDataByCssVariable[family.cssVariable] = fontData;
	}
	return fontDataByCssVariable;
}
export { collectFontData };
