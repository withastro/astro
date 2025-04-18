/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { AstroFontProvider, PreloadData, ResolvedFontProvider } from './types.js';
import type * as unifont from 'unifont';
import type { GetMetricsForFamily } from './utils.js';

export interface Hasher {
	hashString: (input: string) => string;
	hashObject: (input: Record<string, any>) => string;
}

export interface RemoteFontProviderModResolver {
	resolve: (id: string) => Promise<any>;
}

export interface RemoteFontProviderResolver {
	resolve: (provider: AstroFontProvider) => Promise<ResolvedFontProvider>;
}

export interface LocalProviderUrlResolver {
	resolve: (input: string) => string;
}

type SingleErrorInput<TType extends string, TData extends Record<string, any>> = {
	type: TType;
	data: TData;
	cause: unknown;
};

export type ErrorHandlerInput =
	| SingleErrorInput<
			'cannot-load-font-provider',
			{
				entrypoint: string;
			}
	  >
	| SingleErrorInput<'unknown-fs-error', {}>;

export interface ErrorHandler {
	handle: (input: ErrorHandlerInput) => Error;
}

export interface UrlProxy {
	proxy: (input: {
		url: string;
		collectPreload: boolean;
	}) => string;
}

export interface UrlProxyContentResolver {
	resolve: (url: string) => string;
}

export interface DataCollector {
	collect: (input: {
		originalUrl: string;
		hash: string;
		preload: PreloadData[number] | null;
	}) => void;
}

export interface CssRenderer {
	generateFontFace: (family: string, font: unifont.FontFaceData) => string;
	generateCssVariable: (key: string, values: Array<string>) => string;
}

export interface FontMetricsResolver {
	// TODO: do not keep type like this
	getMetrics: GetMetricsForFamily;
	generateFontFace: any
}
