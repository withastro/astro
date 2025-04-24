import type * as unifont from 'unifont';
import type { z } from 'zod';
import type {
	fontProviderSchema,
	localFontFamilySchema,
	remoteFontFamilySchema,
} from './config.js';
import type { FONT_TYPES, GENERIC_FALLBACK_NAMES } from './constants.js';
import type { Font } from '@capsizecss/unpack';
import type { CollectedFontForMetrics } from './logic/optimize-fallbacks.js';

export type AstroFontProvider = z.infer<typeof fontProviderSchema>;

export interface ResolvedFontProvider {
	name?: string;
	provider: (config?: Record<string, any>) => unifont.Provider;
	config?: Record<string, any>;
}

export type LocalFontFamily = z.infer<typeof localFontFamilySchema>;

interface ResolvedFontFamilyAttributes {
	nameWithHash: string;
}

export interface ResolvedLocalFontFamily
	extends ResolvedFontFamilyAttributes,
		Omit<LocalFontFamily, 'variants'> {
	variants: Array<
		Omit<LocalFontFamily['variants'][number], 'weight' | 'src'> & {
			weight: string;
			src: Array<{ url: string; tech?: string }>;
		}
	>;
}

type RemoteFontFamily = z.infer<typeof remoteFontFamilySchema>;

/** @lintignore somehow required by pickFontFaceProperty in utils */
export interface ResolvedRemoteFontFamily
	extends ResolvedFontFamilyAttributes,
		Omit<z.output<typeof remoteFontFamilySchema>, 'provider' | 'weights'> {
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

export interface CreateUrlProxyParams {
	local: boolean;
	hasUrl: (hash: string) => boolean;
	saveUrl: (hash: string, url: string) => void;
	savePreload: (preload: PreloadData) => void;
	saveFontData: (collected: CollectedFontForMetrics) => void;
}
