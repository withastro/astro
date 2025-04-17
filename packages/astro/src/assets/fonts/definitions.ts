import type { AstroFontProvider, ResolvedFontProvider } from './types.js';

export interface Hasher {
	hashString: (input: string) => string;
	hashObject: (input: Record<string, any>) => string;
}

export interface RemoteFontProviderModResolver {
	resolve: (id: string) => Promise<any>;
}

export interface RemoteFontProviderResolver {
	resolve: (input: {
		provider: AstroFontProvider;
		modResolver: RemoteFontProviderModResolver;
	}) => Promise<ResolvedFontProvider>;
}

export interface LocalProviderUrlResolver {
	resolve: (input: string) => string;
}

type SingleErrorInput<TType extends string, TData extends Record<string, any>> = {
	type: TType;
	data: TData;
	cause: unknown;
};

export type ErrorHandlerInput = SingleErrorInput<
	'cannot-load-font-provider',
	{
		entrypoint: string;
	}
>;

export interface ErrorHandler {
	handle: (input: ErrorHandlerInput) => Error;
}
