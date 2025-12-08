import type { Font } from '@capsizecss/unpack';
import type { z } from 'zod';
import type {
	fontProviderSchema,
	localFontFamilySchema,
	remoteFontFamilySchema,
	styleSchema,
} from './config.js';
import type { FONT_TYPES, GENERIC_FALLBACK_NAMES } from './constants.js';
import type { CollectedFontForMetrics } from './core/optimize-fallbacks.js';

export type AstroFontProvider = z.infer<typeof fontProviderSchema>;

export type LocalFontFamily = z.infer<typeof localFontFamilySchema>;

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

type RemoteFontFamily = z.infer<typeof remoteFontFamilySchema>;

/** @lintignore somehow required by pickFontFaceProperty in utils */
export interface ResolvedRemoteFontFamily
	extends ResolvedFontFamilyAttributes,
		Omit<z.output<typeof remoteFontFamilySchema>, 'provider' | 'weights'> {
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

export type Awaitable<T> = T | Promise<T>;

export interface AstroFontProviderInitContext {
	storage: {
		getItem: {
			<T = unknown>(key: string): Promise<T | null>;
			<T = unknown>(key: string, init: () => Awaitable<T>): Promise<T>;
		};
		setItem: (key: string, value: unknown) => Awaitable<void>;
	};
}

export interface AstroFontProviderResolveFontOptions {
	familyName: string;
	weights?: string[] | undefined;
	styles?: Style[] | undefined;
	subsets?: string[] | undefined;
	formats?: FontType[] | undefined;
}
