import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as unifont from 'unifont';
import { FONT_FORMATS } from '../constants.js';
import type { FontFileReader, FontTypeExtractor } from '../definitions.js';
import type {
	FamilyProperties,
	FontProvider,
	FontProviderInitContext,
	ResolveFontOptions,
} from '../types.js';

interface NormalizedSource {
	url: string;
	tech: string | undefined;
}

type RawSource =
	| string
	| URL
	| {
			url: string | URL;
			tech?: string | undefined;
	  };

interface Variant extends FamilyProperties {
	/**
	 * Font [sources](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src). It can be a path relative to the root, a package import or a URL. URLs are particularly useful if you inject local fonts through an integration.
	 */
	src: [RawSource, ...Array<RawSource>];
}

interface FamilyOptions {
	/**
	 * Each variant represents a [`@font-face` declaration](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/).
	 */
	variants: [Variant, ...Array<Variant>];
}

// TODO:
export class LocalFontProvider implements FontProvider<FamilyOptions> {
	name = 'local';
	config?: Record<string, any> | undefined;

	#fontFileReader: FontFileReader;
	#fontTypeExtractor: FontTypeExtractor;
	#root: URL | undefined;

	constructor({
		fontFileReader,
		fontTypeExtractor,
	}: {
		fontFileReader: FontFileReader;
		fontTypeExtractor: FontTypeExtractor;
	}) {
		this.config = undefined;
		this.#fontFileReader = fontFileReader;
		this.#fontTypeExtractor = fontTypeExtractor;
		this.#root = undefined;
	}

	init(context: FontProviderInitContext): void {
		this.#root = context.root;
	}

	#resolveEntrypoint(root: URL, entrypoint: string): URL {
		const require = createRequire(root);

		try {
			return pathToFileURL(require.resolve(entrypoint));
		} catch {
			return new URL(entrypoint, root);
		}
	}

	#normalizeSource(value: RawSource): NormalizedSource {
		const isValue = typeof value === 'string' || value instanceof URL;
		const url = (isValue ? value : value.url).toString();
		const tech = isValue ? undefined : value.tech;
		return {
			url: fileURLToPath(this.#resolveEntrypoint(this.#root ?? new URL(import.meta.url), url)),
			tech,
		};
	}

	async resolveFont(
		options: ResolveFontOptions<FamilyOptions>,
	): Promise<{ fonts: Array<unifont.FontFaceData> } | undefined> {
		return {
			// TODO: ! shouldn't be needed
			fonts: options.options!.variants.map((variant) => {
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
				data.src = variant.src.map((rawSource, index) => {
					const source = this.#normalizeSource(rawSource);
					// We only try to infer for the first source. Indeed if it doesn't work, the function
					// call will throw an error so that will be interrupted anyways
					if (shouldInfer && index === 0) {
						const result = this.#fontFileReader.extract({
							family: options.familyName,
							url: source.url,
						});
						if (variant.weight === undefined) data.weight = result.weight;
						if (variant.style === undefined) data.style = result.style;
					}

					const type = this.#fontTypeExtractor.extract(source.url);

					return {
						originalURL: source.url,
						// TODO: proxy will move somewhere else
						// @ts-expect-error
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
}
