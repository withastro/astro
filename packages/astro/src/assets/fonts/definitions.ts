import type * as unifont from 'unifont';
import type { CollectedFontForMetrics } from './logic/optimize-fallbacks.js';
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
	AstroFontProvider,
	FontFaceMetrics,
	FontFileData,
	FontType,
	GenericFallbackName,
	PreloadData,
	ResolvedFontProvider,
	Style,
} from './types.js';

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
	| SingleErrorInput<'cannot-extract-font-type', { url: string }>
	| SingleErrorInput<'cannot-extract-data', { family: string; url: string }>;

export interface ErrorHandler {
	handle: (input: ErrorHandlerInput) => Error;
}

interface ProxyData {
	weight: unifont.FontFaceData['weight'];
	style: unifont.FontFaceData['style'];
	subset: NonNullable<unifont.FontFaceData['meta']>['subset'];
}

export interface UrlProxy {
	proxy: (
		input: Pick<FontFileData, 'url' | 'init'> & {
			type: FontType;
			collectPreload: boolean;
			data: ProxyData;
		},
	) => string;
}

export interface UrlResolver {
	resolve: (hash: string) => string;
	getCspResources: () => Array<string>;
}

export interface UrlProxyContentResolver {
	resolve: (url: string) => string;
}

export interface DataCollector {
	collect: (
		input: FontFileData & {
			data: ProxyData;
			preload: PreloadData | null;
		},
	) => void;
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
	fetch: (input: FontFileData) => Promise<Buffer>;
}

export interface FontTypeExtractor {
	extract: (url: string) => FontType;
}

export interface FontFileReader {
	extract: (input: { family: string; url: string }) => {
		weight: string;
		style: Style;
	};
}

export interface UrlProxyHashResolver {
	resolve: (input: {
		originalUrl: string;
		type: FontType;
		cssVariable: string;
		data: ProxyData;
	}) => string;
}

export interface StringMatcher {
	getClosestMatch: (target: string, candidates: Array<string>) => string;
}
