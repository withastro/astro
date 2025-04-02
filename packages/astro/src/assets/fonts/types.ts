import type { z } from 'zod';
import type {
	GOOGLE_PROVIDER_NAME,
	LOCAL_PROVIDER_NAME,
	BUILTIN_PROVIDERS,
	FONT_TYPES,
} from './constants.js';
import type * as unifont from 'unifont';
import type {
	remoteFontFamilySchema,
	baseFamilyAttributesSchema,
	fontProviderSchema,
	localFontFamilySchema,
	sharedFontOptionsSchema,
} from './config.js';

// TODO: jsdoc for everything, most of those end up in the public AstroConfig type

export type FontProvider = z.infer<typeof fontProviderSchema>;

export interface ResolvedFontProvider {
	name?: string;
	provider: (config?: Record<string, any>) => unifont.Provider;
	config?: Record<string, any>;
}

export type SharedFontOptions = z.output<typeof sharedFontOptionsSchema>;

export interface FontFamilyAttributes
	extends z.infer<typeof baseFamilyAttributesSchema>,
		Partial<SharedFontOptions> {}

export type LocalFontFamily = z.infer<typeof localFontFamilySchema>;

interface ResolvedLocalFontFamily extends LocalFontFamily {
	provider: LocalProviderName;
}

interface RemoteFontFamily<TProvider extends GoogleProviderName | FontProvider>
	extends z.infer<typeof remoteFontFamilySchema> {
	provider?: TProvider;
}

interface ResolvedRemoteFontFamily
	extends Omit<z.output<typeof remoteFontFamilySchema>, 'provider'> {
	provider: ResolvedFontProvider;
}

export type FontFamily<TProvider extends BuiltInProvider | FontProvider> =
	TProvider extends GoogleProviderName
		? RemoteFontFamily<TProvider>
		: TProvider extends FontProvider
			? RemoteFontFamily<TProvider>
			: LocalFontFamily;

export type ResolvedFontFamily = ResolvedLocalFontFamily | ResolvedRemoteFontFamily;

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
