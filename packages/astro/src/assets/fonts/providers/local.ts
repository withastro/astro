import type * as unifont from 'unifont';
import { FONT_FORMAT_MAP } from '../constants.js';
import type { ResolvedLocalFontFamily } from '../types.js';
import type { FontTypeExtractor, UrlProxy } from '../definitions.js';

interface Options {
	family: ResolvedLocalFontFamily;
	urlProxy: UrlProxy;
	fontTypeExtractor: FontTypeExtractor;
}

export function resolveLocalFont({ family, urlProxy, fontTypeExtractor }: Options): {
	fonts: Array<unifont.FontFaceData>;
} {
	const fonts: Array<unifont.FontFaceData> = [];

	for (const variant of family.variants) {
		const data: unifont.FontFaceData = {
			weight: variant.weight,
			style: variant.style,
			src: variant.src.map((source, index) => {
				return {
					originalURL: source.url,
					url: urlProxy.proxy({
						url: source.url,
						// TODO: explain
						collectPreload: index === 0,
						data: {
							weight: variant.weight,
							style: variant.style,
						},
					}),
					format: FONT_FORMAT_MAP[fontTypeExtractor.extract(source.url)],
					tech: source.tech,
				};
			}),
		};
		if (variant.display) data.display = variant.display;
		if (variant.unicodeRange) data.unicodeRange = variant.unicodeRange;
		if (variant.stretch) data.stretch = variant.stretch;
		if (variant.featureSettings) data.featureSettings = variant.featureSettings;
		if (variant.variationSettings) data.variationSettings = variant.variationSettings;

		fonts.push(data);
	}

	return {
		fonts,
	};
}
