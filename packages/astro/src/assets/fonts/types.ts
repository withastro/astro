import type { z } from 'zod';
import type {
	GOOGLE_PROVIDER_NAME,
	LOCAL_PROVIDER_NAME,
	BUILTIN_PROVIDERS,
	FONT_TYPES,
} from './constants.js';
import type * as unifont from 'unifont';
import type { fontFamilyAttributesSchema, resolveFontOptionsSchema } from './config.js';

// TODO: jsdoc for everything, most of those end up in the public AstroConfig type

export interface FontProvider<TName extends string> {
	name: TName;
	entrypoint: string | URL;
	config?: Record<string, any>;
}

export interface ResolvedFontProvider {
	name: string;
	provider: (config?: Record<string, any>) => unifont.Provider;
	config?: Record<string, any>;
}

export type ResolveFontOptions = z.output<typeof resolveFontOptionsSchema>;

export interface FontFamilyAttributes
	extends z.infer<typeof fontFamilyAttributesSchema>,
		Partial<ResolveFontOptions> {}

export interface LocalFontFamily extends Pick<FontFamilyAttributes, 'name' | 'fallbacks' | 'as'> {
	provider: LocalProviderName;
	src: Array<Partial<Omit<ResolveFontOptions, 'fallbacks'>> & { paths: Array<string> }>;
}

interface CommonFontFamily<TProvider extends string>
	extends Omit<FontFamilyAttributes, 'provider'> {
	provider: TProvider;
}

export type FontFamily<TProvider extends string> = TProvider extends LocalProviderName
	? LocalFontFamily
	: CommonFontFamily<TProvider>;

export type LocalProviderName = typeof LOCAL_PROVIDER_NAME;
export type GoogleProviderName = typeof GOOGLE_PROVIDER_NAME;
export type BuiltInProvider = (typeof BUILTIN_PROVIDERS)[number];

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
