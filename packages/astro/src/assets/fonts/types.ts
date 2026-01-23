import type { Font } from '@capsizecss/unpack';
import type * as unifont from 'unifont';
import type { z } from 'zod';
import type { displaySchema, styleSchema, weightSchema } from './config.js';
import type { FONT_TYPES, GENERIC_FALLBACK_NAMES } from './constants.js';
import type { CollectedFontForMetrics } from './core/optimize-fallbacks.js';

export type Weight = z.infer<typeof weightSchema>;
type Display = z.infer<typeof displaySchema>;

export interface FontProviderInitContext {
	storage: {
		getItem: {
			<T = unknown>(key: string): Promise<T | null>;
			<T = unknown>(key: string, init: () => Awaitable<T>): Promise<T>;
		};
		setItem: (key: string, value: unknown) => Awaitable<void>;
	};
	root: URL;
}

type Awaitable<T> = T | Promise<T>;

export interface FontProvider<
	TFamilyOptions extends Record<string, any> | undefined | never = never,
> {
	/**
	 * The font provider name, used for display and deduplication.
	 */
	name: string;
	/**
	 * Optional serializable object, used for deduplication.
	 */
	config?: Record<string, any> | undefined;
	/**
	 * Optional callback, used to perform any initialization logic.
	 */
	init?: ((context: FontProviderInitContext) => Awaitable<void>) | undefined;
	/**
	 * Required callback, used to retrieve and return font face data based on the given options.
	 */
	resolveFont: (options: ResolveFontOptions<TFamilyOptions>) => Awaitable<
		| {
				fonts: Array<unifont.FontFaceData>;
		  }
		| undefined
	>;
	/**
	 * Optional callback, used to return the list of available font names.
	 */
	listFonts?: (() => Awaitable<Array<string> | undefined>) | undefined;
}

export interface FamilyProperties {
	/**
	 * @default `"swap"`
	 *
	 * A [font display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display).
	 */
	display?: Display | undefined;
	/**
	 * A [font stretch](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-stretch).
	 */
	stretch?: string | undefined;
	/**
	 * Font [feature settings](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-feature-settings).
	 */
	featureSettings?: string | undefined;
	/**
	 * Font [variation settings](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-variation-settings).
	 */
	variationSettings?: string | undefined;
	/**
	 * A [unicode range](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range).
	 */
	unicodeRange?: [string, ...Array<string>] | undefined;
}

type WithOptions<TFontProvider extends FontProvider> = TFontProvider extends FontProvider<
	infer TFamilyOptions
>
	? [TFamilyOptions] extends [never]
		? {
				/**
				 * Options forwarded to the font provider while resolving this font family.
				 */
				options?: undefined;
			}
		: undefined extends TFamilyOptions
			? {
					/**
					 * Options forwarded to the font provider while resolving this font family.
					 */
					options?: TFamilyOptions;
				}
			: {
					/**
					 * Options forwarded to the font provider while resolving this font family.
					 */
					options: TFamilyOptions;
				}
	: {
			/**
			 * Options forwarded to the font provider while resolving this font family.
			 */
			options?: undefined;
		};

export type FontFamily<TFontProvider extends FontProvider = FontProvider> = FamilyProperties &
	WithOptions<NoInfer<TFontProvider>> & {
		/**
		 * The font family name, as identified by your font provider.
		 */
		name: string;
		/**
		 * A valid [ident](https://developer.mozilla.org/en-US/docs/Web/CSS/ident) in the form of a CSS variable (i.e. starting with `--`).
		 */
		cssVariable: string;
		/**
		 * The source of your font files. You can use a built-in provider or write your own custom provider.
		 */
		provider: TFontProvider;
		/**
		 * @default `[400]`
		 *
		 * An array of [font weights](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight). If the associated font is a [variable font](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide), you can specify a range of weights:
		 *
		 * ```js
		 * weight: "100 900"
		 * ```
		 */
		weights?: [Weight, ...Array<Weight>] | undefined;
		/**
		 * @default `["normal", "italic"]`
		 *
		 * An array of [font styles](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style).
		 */
		styles?: [Style, ...Array<Style>] | undefined;
		/**
		 * @default `["latin"]`
		 *
		 * An array of [font subsets](https://knaap.dev/posts/font-subsetting/):
		 */
		subsets?: [string, ...Array<string>] | undefined;
		/**
		 * @default `["woff2"]`
		 *
		 * An array of [font formats](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/src#font_formats).
		 */
		formats?: [FontType, ...Array<FontType>] | undefined;
		/**
	 * @default `["sans-serif"]`
	 *
	 * An array of fonts to use when your chosen font is unavailable, or loading. Fallback fonts will be chosen in the order listed. The first available font will be used:
	 *
	 * ```js
	 * fallbacks: ["CustomFont", "serif"]
	 * ```
	 *
	 * To disable fallback fonts completely, configure an empty array:
	 *
	 * ```js
	 * fallbacks: []
	 * ```
	 *

	 * If the last font in the `fallbacks` array is a [generic family name](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family#generic-name), Astro will attempt to generate [optimized fallbacks](https://developer.chrome.com/blog/font-fallbacks) using font metrics will be generated. To disable this optimization, set `optimizedFallbacks` to false.
	 */
		fallbacks?: Array<string> | undefined;
		/**
		 * @default `true`
		 *
		 * Whether or not to enable optimized fallback generation. You may disable this default optimization to have full control over `fallbacks`.
		 */
		optimizedFallbacks?: boolean | undefined;
	};

export interface ResolvedFontFamily extends Omit<FontFamily, 'weights'> {
	uniqueName: string;
	weights?: Array<string>;
}

export type FontType = (typeof FONT_TYPES)[number];

/**
 * Preload data is used for links generation inside the <Font /> component
 */
export interface PreloadData {
	/**
	 * Absolute link to a font file, eg. /_astro/fonts/abc.woff
	 */
	url: string;
	/**
	 * A font type, eg. woff2, woff, ttf...
	 */
	type: FontType;
	weight: string | undefined;
	style: string | undefined;
	subset: string | undefined;
}

export type FontFaceMetrics = Pick<
	Font,
	'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'
>;

export type GenericFallbackName = (typeof GENERIC_FALLBACK_NAMES)[number];

export type Defaults = Required<
	Pick<
		ResolvedFontFamily,
		'weights' | 'styles' | 'subsets' | 'fallbacks' | 'optimizedFallbacks' | 'formats'
	>
>;

export interface FontFileData {
	id: string;
	url: string;
	init: RequestInit | undefined;
}

/**
 * Holds associations of id and original font file URLs, so they can be
 * downloaded whenever the id is requested.
 */
export type FontFileById = Map<FontFileData['id'], Pick<FontFileData, 'url' | 'init'>>;

export type ComponentDataByCssVariable = Map<string, { preloads: Array<PreloadData>; css: string }>;

export interface FontData {
	src: Array<{ url: string; format?: string; tech?: string }>;
	weight?: string;
	style?: string;
}

/**
 * Holds associations of CSS variables and font data to be exposed via virtual module.
 */
export type FontDataByCssVariable = Record<string, Array<FontData>>;

export type Style = z.output<typeof styleSchema>;

export type PreloadFilter =
	| boolean
	| Array<{ weight?: string | number; style?: string; subset?: string }>;

export interface ResolveFontOptions<
	FamilyOptions extends Record<string, any> | undefined | never = never,
> {
	familyName: string;
	weights: string[];
	styles: Style[];
	subsets: string[];
	formats: FontType[];
	options: [FamilyOptions] extends [never] ? undefined : FamilyOptions | undefined;
}

export type CssProperties = Record<string, string | undefined>;

export interface FontFamilyAssets {
	family: ResolvedFontFamily;
	fonts: Array<unifont.FontFaceData>;
	/**
	 * Holds a list of font files to be used for optimized fallbacks generation
	 */
	collectedFontsForMetricsByUniqueKey: Map<string, CollectedFontForMetrics>;
	preloads: Array<PreloadData>;
}

export type FontFamilyAssetsByUniqueKey = Map<string, FontFamilyAssets>;

export type Collaborator<T extends (input: any) => any, U extends keyof Parameters<T>[0]> = (
	params: Pick<Parameters<T>[0], U>,
) => ReturnType<T>;

export type BufferImports = Record<string, () => Promise<{ default: Buffer | null }>>;
