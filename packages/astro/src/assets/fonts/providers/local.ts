import type * as unifont from 'unifont';
import type { ResolvedLocalFontFamily } from '../types.js';
import { extractFontType } from '../utils.js';
// TODO: pass as argument
import { fontace } from 'fontace';

// https://fonts.nuxt.com/get-started/providers#local
// https://github.com/nuxt/fonts/blob/main/src/providers/local.ts
// https://github.com/unjs/unifont/blob/main/src/providers/google.ts

type InitializedProvider = NonNullable<Awaited<ReturnType<unifont.Provider>>>;

type ResolveFontResult = NonNullable<Awaited<ReturnType<InitializedProvider['resolveFont']>>>;

interface Options {
	family: ResolvedLocalFontFamily;
	proxyURL: (value: string) => { content: Buffer; url: string };
}

// TODO: comment this mess
// TODO: see if flow can be improved

export function resolveLocalFont({ family, proxyURL }: Options): ResolveFontResult {
	const fonts: ResolveFontResult['fonts'] = [];

	for (const variant of family.variants) {
		const tryInfer =
			// TODO: extract to constant and reuse in ./config
			variant.weight === 'infer' || variant.style === 'infer' || variant.unicodeRange === 'infer';
		// TODO: extract type
		let weight: ResolveFontResult['fonts'][number]['weight'];
		let style: ResolveFontResult['fonts'][number]['style'];
		let unicodeRange: ResolveFontResult['fonts'][number]['unicodeRange'];
		const src: ResolveFontResult['fonts'][number]['src'] = variant.src.map(
			({ url: originalURL, tech }) => {
				const result = proxyURL(originalURL);
				if (tryInfer && (weight === undefined || !style || !unicodeRange)) {
					try {
						const inferred = fontace(result.content);
						weight ??= inferred.weight;
						style ??= inferred.style;
						unicodeRange ??= inferred.unicodeRange.split(', ');
					} catch (cause) {
						// TODO: astro error
					}
				}
				return {
					originalURL,
					url: result.url,
					format: extractFontType(originalURL),
					tech,
				};
			},
		);
		weight ??= variant.weight === 'infer' ? undefined : variant.weight;
		style ??= variant.style === 'infer' ? undefined : variant.style;
		unicodeRange ??= variant.unicodeRange === 'infer' ? undefined : variant.unicodeRange;

		const data: ResolveFontResult['fonts'][number] = {
			weight,
			style,
			src,
			// TODO: test wrong css is not emitted, should not with recent changes
			display: variant.display,
			unicodeRange,
			stretch: variant.stretch,
			featureSettings: variant.featureSettings,
			variationSettings: variant.variationSettings,
		};

		fonts.push(data);
	}

	return {
		fonts,
	};
}
