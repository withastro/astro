import type { z } from 'zod';
import type { FONT_TYPES } from './constants.js';
import type * as unifont from 'unifont';
import type {
	remoteFontFamilySchema,
	fontProviderSchema,
	localFontFamilySchema,
} from './config.js';

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
export type PreloadData = Array<{
	/**
	 * Absolute link to a font file, eg. /_astro/fonts/abc.woff
	 */
	url: string;
	/**
	 * A font type, eg. woff2, woff, ttf...
	 */
	type: FontType;
}>;
