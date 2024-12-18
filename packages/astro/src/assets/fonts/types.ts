import type { BUILTIN_PROVIDERS } from './constants.js';

export interface FontProvider<TName extends string, TConfig extends Record<string, any>> {
	name: TName;
	entrypoint: string;
	config?: TConfig;
}

export type FontFamily<TProvider extends string> = {
	provider: TProvider;
} & (TProvider extends 'local'
	? {
			src: any;
		}
	: // eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{});

export type BuiltInProvider = (typeof BUILTIN_PROVIDERS)[number];
