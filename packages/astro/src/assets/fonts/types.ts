import type { BUILTIN_PROVIDERS } from './constants.js';
import type { GOOGLE_PROVIDER_NAME } from './providers/google.js';
import type { LOCAL_PROVIDER_NAME } from './providers/local.js';
import type * as unifont from 'unifont';

export interface FontProvider<TName extends string> {
	name: TName;
	entrypoint: string;
	config?: Record<string, any>;
}

export interface ResolvedFontProvider {
	name: string;
	provider: (config?: Record<string, any>) => UnifontProvider;
	config?: Record<string, any>;
}

export type UnifontProvider = unifont.Provider;

type LocalFontFamily = {
	provider: LocalProviderName;
	// TODO: refine type
	src: string;
};

type StandardFontFamily<TProvider extends string> = {
	provider: TProvider;
};

export type FontFamily<TProvider extends string> = TProvider extends LocalProviderName
	? LocalFontFamily
	: StandardFontFamily<TProvider>;

export type LocalProviderName = typeof LOCAL_PROVIDER_NAME;
export type GoogleProviderName = typeof GOOGLE_PROVIDER_NAME;
export type BuiltInProvider = (typeof BUILTIN_PROVIDERS)[number];
