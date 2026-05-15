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
type RawSource =
	| string
	| URL
	| {
			url: string | URL;
			tech?: string | undefined;
	  };
interface Variant extends FamilyProperties {
	/**
	 * Font [sources](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src). It can be a path relative to the root, a package import, or a URL. URLs are particularly useful if you inject local fonts through an integration.
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
export declare class LocalFontProvider implements FontProvider<LocalFamilyOptions> {
	#private;
	name: string;
	config?: Record<string, any> | undefined;
	constructor({ fontFileReader }: { fontFileReader: FontFileReader });
	init(context: Pick<FontProviderInitContext, 'root'>): void;
	resolveFont(options: ResolveFontOptions<LocalFamilyOptions>): {
		fonts: Array<unifont.FontFaceData>;
	};
}
export {};
