import type * as unifont from 'unifont';
import { FONT_FORMAT_MAP } from '../constants.js';
import type { FontFileReader, FontTypeExtractor, UrlProxy } from '../definitions.js';
import type { ResolvedLocalFontFamily } from '../types.js';

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
		fonts: family.variants.map((variant) => {
			const tryInfer =
				// TODO: extract to constant and reuse in ./config
				variant.weight === 'infer' || variant.style === 'infer' || variant.unicodeRange === 'infer';

			// We prepare the data
			const data: unifont.FontFaceData = {
				// If it should be inferred, we don't want to set the value
				weight: variant.weight === 'infer' ? undefined : variant.weight,
				style: variant.style === 'infer' ? undefined : variant.style,
				unicodeRange: variant.unicodeRange === 'infer' ? undefined : variant.unicodeRange,
				// Gotta please TypeScript! We'll fill it after
				src: [],
				display: variant.display,
				stretch: variant.stretch,
				featureSettings: variant.featureSettings,
				variationSettings: variant.variationSettings,
			};
			// We proxy each source
			data.src = variant.src.map((source, index) => {
				// We only try to infer for the first source
				if (tryInfer && index === 0) {
					const result = fontFileReader.extract(source.url);
					if (variant.weight === 'infer') data.weight = result.weight;
					if (variant.style === 'infer') data.style = result.style;
					if (variant.unicodeRange === 'infer') data.unicodeRange = result.unicodeRange;
				}

				return {
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
				};
			});
			return data;
		}),
	};
}
