import type * as unifont from 'unifont';
import { FONT_FORMAT_MAP } from '../constants.js';
import type { FontFileReader, FontTypeExtractor, UrlProxy } from '../definitions.js';
import type { ResolvedLocalFontFamily } from '../types.js';
// TODO: https://github.com/withastro/astro/pull/13640/commits/c3e6c4adf7b9044de6b1a067b5a505d0627d2f9f

interface Options {
	family: ResolvedLocalFontFamily;
	urlProxy: UrlProxy;
	fontTypeExtractor: FontTypeExtractor;
	fontFileReader: FontFileReader;
}

export function resolveLocalFont({
	family,
	urlProxy,
	fontTypeExtractor,
	fontFileReader,
}: Options): {
	fonts: Array<unifont.FontFaceData>;
} {
	return {
		fonts: family.variants.map((variant) => ({
			weight: variant.weight,
			style: variant.style,
			// We proxy each source
			src: variant.src.map((source, index) => ({
				// TODO: use fontFileReader
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
