import type * as unifont from 'unifont';
import { FONT_FORMAT_MAP } from '../constants.js';
import type { ResolvedLocalFontFamily } from '../types.js';
import { extractFontType } from '../utils.js';
import type { UrlProxy } from '../definitions.js';

// https://fonts.nuxt.com/get-started/providers#local
// https://github.com/nuxt/fonts/blob/main/src/providers/local.ts
// https://github.com/unjs/unifont/blob/main/src/providers/google.ts

type InitializedProvider = NonNullable<Awaited<ReturnType<unifont.Provider>>>;

type ResolveFontResult = NonNullable<Awaited<ReturnType<InitializedProvider['resolveFont']>>>;

interface Options {
	family: ResolvedLocalFontFamily;
	urlProxy: UrlProxy;
}

export function resolveLocalFont({ family, urlProxy }: Options): ResolveFontResult {
	const fonts: ResolveFontResult['fonts'] = [];

	for (const variant of family.variants) {
		const data: ResolveFontResult['fonts'][number] = {
			weight: variant.weight,
			style: variant.style,
			src: variant.src.map((source, index) => {
				return {
					originalURL: source.url,
					url: urlProxy.proxy({
						url: source.url,
						// TODO: explain
						collectPreload: index === 0,
					}),
					format: FONT_FORMAT_MAP[extractFontType(source.url)],
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
