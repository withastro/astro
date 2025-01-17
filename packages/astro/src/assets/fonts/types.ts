import type { BUILTIN_PROVIDERS } from './constants.js';

export interface FontProvider<TName extends string> {
	name: TName;
	entrypoint: string;
	config?: Record<string, any>;
}

type LocalFontFamily = {
	provider: 'local';
	// TODO: refine type
	src: string;
};

type StandardFontFamily<TProvider extends string> = {
	provider: TProvider;
};

export type FontFamily<TProvider extends string> = TProvider extends 'local'
	? LocalFontFamily
	: StandardFontFamily<TProvider>;

export type BuiltInProvider = (typeof BUILTIN_PROVIDERS)[number];
