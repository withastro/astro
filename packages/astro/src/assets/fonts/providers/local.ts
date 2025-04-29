import type * as unifont from 'unifont';
import { FONT_FORMAT_MAP } from '../constants.js';
import type { FontTypeExtractor, UrlProxy } from '../definitions.js';
import type { ResolvedLocalFontFamily } from '../types.js';

interface Options {
	family: ResolvedLocalFontFamily;
	urlProxy: UrlProxy;
	fontTypeExtractor: FontTypeExtractor;
}

export function resolveLocalFont({ family, urlProxy, fontTypeExtractor }: Options): {
	fonts: Array<unifont.FontFaceData>;
} {
	return {
		fonts: family.variants.map((variant) => ({
			weight: variant.weight,
			style: variant.style,
			// We proxy each source
			src: variant.src.map((source, index) => ({
				originalURL: source.url,
				url: urlProxy.proxy({
					url: source.url,
					// We only use the first source for preloading. For example if woff2 and woff
					// are available, we only keep woff2.
					collectPreload: index === 0,
					data: {
						weight: variant.weight,
						style: variant.style,
					},
					init: null,
				}),
				format: FONT_FORMAT_MAP[fontTypeExtractor.extract(source.url)],
				tech: source.tech,
			})),
			display: variant.display,
			unicodeRange: variant.unicodeRange,
			stretch: variant.stretch,
			featureSettings: variant.featureSettings,
			variationSettings: variant.variationSettings,
		})),
	};
}
