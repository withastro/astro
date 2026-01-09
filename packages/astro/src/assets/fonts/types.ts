import type { Font } from '@capsizecss/unpack';
import type * as unifont from 'unifont';
import type { z } from 'zod';
import type { displaySchema, styleSchema, weightSchema } from './config.js';
import type { FONT_TYPES, GENERIC_FALLBACK_NAMES, LOCAL_PROVIDER_NAME } from './constants.js';
import type { CollectedFontForMetrics } from './core/optimize-fallbacks.js';

type Weight = z.infer<typeof weightSchema>;
type Display = z.infer<typeof displaySchema>;

export interface AstroFontProvider {
	/**
	 * URL, path relative to the root or package import.
	 */
	entrypoint: string | URL;
	/**
	 * Optional serializable object passed to the unifont provider.
	 */
	config?: Record<string, any> | undefined;
}

interface RequiredFamilyAttributes {
	/**
	 * The font family name, as identified by your font provider.
	 */
	name: string;
	/**
	 * A valid [ident](https://developer.mozilla.org/en-US/docs/Web/CSS/ident) in the form of a CSS variable (i.e. starting with `--`).
	 */
	cssVariable: string;
}

interface Fallbacks {
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
}

interface FamilyProperties {
	/**
	 * A [font weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight). If the associated font is a [variable font](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide), you can specify a range of weights:
	 *
	 * ```js
	 * weight: "100 900"
	 * ```
	 */
	weight?: Weight | undefined;
	/**
	 * A [font style](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style).
	 */
	style?: Style | undefined;
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

export interface ResolvedFontProvider {
	name?: string;
	provider: (config?: Record<string, any>) => unifont.Provider;
	config?: Record<string, any>;
}

type Src =
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
	src: [Src, ...Array<Src>];
}

export interface LocalFontFamily extends RequiredFamilyAttributes, Fallbacks {
	/**
	 * The source of your font files. Set to `"local"` to use local font files.
	 */
	provider: typeof LOCAL_PROVIDER_NAME;
	/**
	 * Each variant represents a [`@font-face` declaration](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/).
	 */
	variants: [Variant, ...Array<Variant>];
}

interface ResolvedFontFamilyAttributes {
	nameWithHash: string;
}

export interface ResolvedLocalFontFamily
	extends ResolvedFontFamilyAttributes,
		Omit<LocalFontFamily, 'variants'> {
	variants: Array<
		Omit<LocalFontFamily['variants'][number], 'weight' | 'src'> & {
			weight?: string;
			src: Array<{ url: string; tech?: string }>;
		}
	>;
}

export interface RemoteFontFamily
	extends RequiredFamilyAttributes,
		Omit<FamilyProperties, 'weight' | 'style'>,
		Fallbacks {
	/**
	 * The source of your font files. You can use a built-in provider or write your own custom provider.
	 */
	provider: AstroFontProvider;
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
}

/** @lintignore somehow required by pickFontFaceProperty in utils */
export interface ResolvedRemoteFontFamily
	extends ResolvedFontFamilyAttributes,
		Omit<RemoteFontFamily, 'provider' | 'weights'> {
	provider: ResolvedFontProvider;
	weights?: Array<string>;
}

export type FontFamily = LocalFontFamily | RemoteFontFamily;
export type ResolvedFontFamily = ResolvedLocalFontFamily | ResolvedRemoteFontFamily;

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

export type Defaults = Partial<
	Pick<
		ResolvedRemoteFontFamily,
		'weights' | 'styles' | 'subsets' | 'fallbacks' | 'optimizedFallbacks'
	>
>;

export interface FontFileData {
	hash: string;
	url: string;
	init: RequestInit | null;
}

export interface CreateUrlProxyParams {
	local: boolean;
	hasUrl: (hash: string) => boolean;
	saveUrl: (input: FontFileData) => void;
	savePreload: (preload: PreloadData) => void;
	saveFontData: (collected: CollectedFontForMetrics) => void;
	cssVariable: string;
}

/**
 * Holds associations of hash and original font file URLs, so they can be
 * downloaded whenever the hash is requested.
 */
export type FontFileDataMap = Map<FontFileData['hash'], Pick<FontFileData, 'url' | 'init'>>;

/**
 * Holds associations of CSS variables and preloadData/css to be passed to the internal virtual module.
 */
export type InternalConsumableMap = Map<string, { preloadData: Array<PreloadData>; css: string }>;

export interface FontData {
	src: Array<{ url: string; format?: string; tech?: string }>;
	weight?: string;
	style?: string;
}

/**
 * Holds associations of CSS variables and font data to be exposed via virtual module.
 */
export type ConsumableMap = Map<string, Array<FontData>>;

export type Style = z.output<typeof styleSchema>;

export type PreloadFilter =
	| boolean
	| Array<{ weight?: string | number; style?: string; subset?: string }>;
