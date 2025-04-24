/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { AstroFontProvider, FontType, PreloadData, ResolvedFontProvider } from './types.js';
import type * as unifont from 'unifont';
import type { FontFaceMetrics, GenericFallbackName } from './types.js';
import type { CollectedFontForMetrics } from './logic/optimize-fallbacks.js';

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
	| SingleErrorInput<'unknown-fs-error', {}>
	| SingleErrorInput<'cannot-fetch-font-file', { url: string }>
	| SingleErrorInput<'cannot-extract-font-type', { url: string }>;

export interface ErrorHandler {
	handle: (input: ErrorHandlerInput) => Error;
}

export interface UrlProxy {
	proxy: (input: {
		url: string;
		collectPreload: boolean;
		data: Partial<unifont.FontFaceData>;
	}) => string;
}

export interface UrlProxyContentResolver {
	resolve: (url: string) => string;
}

export interface DataCollector {
	collect: (input: {
		originalUrl: string;
		hash: string;
		data: Partial<unifont.FontFaceData>;
		preload: PreloadData | null;
	}) => void;
}

export type CssProperties = Record<string, string | undefined>;

export interface CssRenderer {
	generateFontFace: (family: string, properties: CssProperties) => string;
	generateCssVariable: (key: string, values: Array<string>) => string;
}

export interface FontMetricsResolver {
	getMetrics: (name: string, font: CollectedFontForMetrics) => Promise<FontFaceMetrics>;
	generateFontFace: (input: {
		metrics: FontFaceMetrics;
		fallbackMetrics: FontFaceMetrics;
		name: string;
		font: string;
		properties: CssProperties;
	}) => string;
}

export interface SystemFallbacksProvider {
	getLocalFonts: (fallback: GenericFallbackName) => Array<string> | null;
	getMetricsForLocalFont: (family: string) => FontFaceMetrics;
}

export interface FontFetcher {
	fetch: (hash: string, url: string) => Promise<Buffer>;
}

export interface FontTypeExtractor {
	extract: (url: string) => FontType;
}
