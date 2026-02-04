import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as unifont from 'unifont';
import type { FontFileReader } from '../definitions.js';
import type {
	FamilyProperties,
	FontProvider,
	FontProviderInitContext,
	ResolveFontOptions,
	Style,
	Weight,
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
	 *
	 * We recommend not putting your font files in [the `public/` directory](/en/reference/configuration-reference/#publicdir). Since Astro will copy these files into that folder at build time, this will result in duplicated files
	 * in your build output. Instead, store them somewhere else in your project, such as in `src/`.
	 *
	 * You can also specify a [tech](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src#tech) by providing objects:
	 *
	 * ```js
	 * src: [{ url:"./src/assets/fonts/MyFont.woff2", tech: "color-COLRv1" }]
	 * ```
	 */
	src: [RawSource, ...Array<RawSource>];
	/**
	 * A [font weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight). If the associated font is a [variable font](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide), you can specify a range of weights:
	 *
	 * ```js
	 * weight: "100 900"
	 * ```
	 *
	 * When the value is not set, by default Astro will try to infer the value based on the first source.
	 */
	weight?: Weight | undefined;
	/**
	 * A [font style](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style).
	 *
	 * When the value is not set, by default Astro will try to infer the value based on the first source.
	 */
	style?: Style | undefined;
}

export interface LocalFamilyOptions {
	/**
	 * The `options.variants` property is required. Each variant represents a [`@font-face` declaration](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/) and requires a `src`.
	 */
	variants: [Variant, ...Array<Variant>];
}

export class LocalFontProvider implements FontProvider<LocalFamilyOptions> {
	name = 'local';
	config?: Record<string, any> | undefined;

	#fontFileReader: FontFileReader;
	#root: URL | undefined;

	constructor({
		fontFileReader,
	}: {
		fontFileReader: FontFileReader;
	}) {
		this.config = undefined;
		this.#fontFileReader = fontFileReader;
		this.#root = undefined;
	}

	init(context: Pick<FontProviderInitContext, 'root'>): void {
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

	resolveFont(options: ResolveFontOptions<LocalFamilyOptions>): {
		fonts: Array<unifont.FontFaceData>;
	} {
		return {
			fonts:
				options.options?.variants.map((variant) => {
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

						return source;
					});
					return data;
				}) ?? [],
		};
	}
}
