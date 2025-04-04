import type * as unifont from 'unifont';
import type { ResolvedLocalFontFamily } from '../types.js';
import { fileURLToPath } from 'node:url';
import { extractFontType } from '../utils.js';

// https://fonts.nuxt.com/get-started/providers#local
// https://github.com/nuxt/fonts/blob/main/src/providers/local.ts
// https://github.com/unjs/unifont/blob/main/src/providers/google.ts

type InitializedProvider = NonNullable<Awaited<ReturnType<unifont.Provider>>>;

type ResolveFontResult = NonNullable<Awaited<ReturnType<InitializedProvider['resolveFont']>>>;

interface ResolveOptions {
	root: URL;
	proxyURL: (value: string) => string;
}

export function resolveLocalFont(
	family: ResolvedLocalFontFamily,
	{ proxyURL, root }: ResolveOptions,
): ResolveFontResult {
	const fonts: ResolveFontResult['fonts'] = [];

	for (const variant of family.variants) {
		const data: ResolveFontResult['fonts'][number] = {
			weight: variant.weight,
			style: variant.style,
			src: variant.src.map((path) => {
				const originalURL = fileURLToPath(new URL(path, root));
				return {
					originalURL,
					url: proxyURL(originalURL),
					format: extractFontType(path),
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
