import type * as unifont from 'unifont';
import { FONT_FORMATS } from '../constants.js';
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
			const shouldInfer = variant.weight === undefined || variant.style === undefined;

			// We prepare the data
			const data: unifont.FontFaceData = {
				// If it should be inferred, we don't want to set the value
				weight: variant.weight,
				style: variant.style,
				src: [],
				unicodeRange: variant.unicodeRange,
				display: variant.display,
				stretch: variant.stretch,
				featureSettings: variant.featureSettings,
				variationSettings: variant.variationSettings,
			};
			// We proxy each source
			data.src = variant.src.map((source, index) => {
				// We only try to infer for the first source. Indeed if it doesn't work, the function
				// call will throw an error so that will be interruped anyways
				if (shouldInfer && index === 0) {
					const result = fontFileReader.extract({ family: family.name, url: source.url });
					if (variant.weight === undefined) data.weight = result.weight;
					if (variant.style === undefined) data.style = result.style;
				}

				const type = fontTypeExtractor.extract(source.url);

				return {
					originalURL: source.url,
					url: urlProxy.proxy({
						url: source.url,
						type,
						// We only use the first source for preloading. For example if woff2 and woff
						// are available, we only keep woff2.
						collectPreload: index === 0,
						data: {
							weight: data.weight,
							style: data.style,
							subset: undefined,
						},
						init: null,
					}),
					format: FONT_FORMATS.find((e) => e.type === type)?.format,
					tech: source.tech,
				};
			});
			return data;
		}),
	};
}
