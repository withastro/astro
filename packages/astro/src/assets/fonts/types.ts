import type { Font } from '@capsizecss/unpack';
import type * as unifont from 'unifont';
import type * as z from 'zod/v4';
import type { DisplaySchema, StyleSchema, WeightSchema } from './config.js';
import type { FONT_TYPES, GENERIC_FALLBACK_NAMES } from './constants.js';
import type { CollectedFontForMetrics } from './core/optimize-fallbacks.js';

export type Weight = z.infer<typeof WeightSchema>;
type Display = z.infer<typeof DisplaySchema>;

export interface FontProviderInitContext {
	/**
	 * Useful for caching.
	 */
	storage: {
		getItem: {
			<T = unknown>(key: string): Promise<T | null>;
			<T = unknown>(key: string, init: () => Awaitable<T>): Promise<T>;
		};
		setItem: (key: string, value: unknown) => Awaitable<void>;
	};
	/**
	 * The project root, useful for resolving local files paths.
	 */
	root: URL;
}

type Awaitable<T> = T | Promise<T>;

export interface FontProvider<
	TFamilyOptions extends Record<string, any> | undefined | never = never,
> {
	/**
	 * A unique name for the provider, used in logs and for identification.
	 */
	name: string;
	/**
	 * A serializable object, used for identification.
	 */
	config?: Record<string, any> | undefined;
	/**
	 * Optional callback, used to perform any initialization logic.
	 */
	init?: ((context: FontProviderInitContext) => Awaitable<void>) | undefined;
	/**
	 * Used to retrieve and return font face data based on the given options.
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
	 * Defines [how a font displays](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) based on when it is downloaded and ready for use.
	 */
	display?: Display | undefined;
	/**
	 * A [font stretch](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-stretch).
	 */
	stretch?: string | undefined;
	/**
	 * Controls the [typographic font features](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-feature-settings) (e.g. ligatures, small caps, or swashes).
	 */
	featureSettings?: string | undefined;
	/**
	 * Font [variation settings](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-variation-settings).
	 */
	variationSettings?: string | undefined;
	/**
	 * Determines when a font must be downloaded and used based on a specific [range of unicode characters](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range).
	 * If a character on the page matches the configured range, the browser will download the font and all characters will be available for use on the page. To configure a subset of
	 * characters preloaded for a single font, see the [subsets](#fontsubsets) property instead.
	 *
	 * This can be useful for localization to avoid unnecessary font downloads when a specific part of your website uses a different alphabet and will be displayed with a separate
	 * font. For example, a website that offers both English and Japanese versions can prevent the browser from downloading the Japanese font on English versions of the page that do
	 * not contain any of the Japanese characters provided in `unicodeRange`.
	 */
	unicodeRange?: [string, ...Array<string>] | undefined;
}

type WithOptions<TFontProvider extends FontProvider> =
	TFontProvider extends FontProvider<infer TFamilyOptions>
		? [TFamilyOptions] extends [never]
			? {
					/**
					 * An object to pass provider specific options. It is typed automatically based on the font family provider.
					 */
					options?: undefined;
				}
			: undefined extends TFamilyOptions
				? {
						/**
						 * An object to pass provider specific options. It is typed automatically based on the font family provider.
						 */
						options?: TFamilyOptions;
					}
				: {
						/**
						 * An object to pass provider specific options. It is typed automatically based on the font family provider.
						 */
						options: TFamilyOptions;
					}
		: {
				/**
				 * An object to pass provider specific options. It is typed automatically based on the font family provider.
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
		 * An array of [font weights](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight). If no value is specified in your configuration, only weight `400` is
		 * included by default to prevent unnecessary downloads. You will need to include this property to access any other font weights.
		 *
		 * If the associated font is a [variable font](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide), you can specify a range of weights:
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
		 * Defines a list of [font subsets](https://knaap.dev/posts/font-subsetting/).
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
		 * If the last font in the `fallbacks` array is a [generic family name](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family#generic-name), Astro will attempt to
		 * generate [optimized fallbacks](https://developer.chrome.com/blog/font-fallbacks) using font metrics will be generated. To disable this optimization, set `optimizedFallbacks` to false.
		 */
		fallbacks?: Array<string> | undefined;
		/**
		 * @default `true`
		 *
		 * Whether or not to enable Astro's default optimization when generating fallback fonts. You may disable this default optimization to have full control over how `fallbacks` are generated.
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

export type Style = z.output<typeof StyleSchema>;

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
