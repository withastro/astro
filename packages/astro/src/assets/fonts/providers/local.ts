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
				variant.weight === undefined || variant.style === undefined || variant.unicodeRange === undefined;

			// We prepare the data
			const data: unifont.FontFaceData = {
				// If it should be inferred, we don't want to set the value
				weight: variant.weight,
				style: variant.style,
				unicodeRange: variant.unicodeRange,
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
					const result = fontFileReader.extract({ family: family.name, url: source.url });
					if (variant.weight === undefined) data.weight = result.weight;
					if (variant.style === undefined) data.style = result.style;
					if (variant.unicodeRange === undefined) data.unicodeRange = result.unicodeRange;
				}

				return {
					originalURL: source.url,
					url: urlProxy.proxy({
						url: source.url,
						// We only use the first source for preloading. For example if woff2 and woff
						// are available, we only keep woff2.
						collectPreload: index === 0,
						data: {
							weight: data.weight,
							style: data.style,
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
