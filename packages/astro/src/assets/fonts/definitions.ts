import type * as unifont from 'unifont';
import type { CollectedFontForMetrics } from './core/optimize-fallbacks.js';
import type {
	FontFaceMetrics,
	FontFileData,
	FontType,
	GenericFallbackName,
	ResolveFontOptions,
	Style,
} from './types.js';

export interface Hasher {
	hashString: (input: string) => string;
	hashObject: (input: Record<string, any>) => string;
}

export interface ProxyData {
	weight: unifont.FontFaceData['weight'];
	style: unifont.FontFaceData['style'];
	subset: NonNullable<unifont.FontFaceData['meta']>['subset'];
}

export interface UrlResolver {
	resolve: (hash: string) => string;
	readonly cspResources: Array<string>;
}

export interface UrlProxyContentResolver {
	resolve: (url: string) => string;
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

export interface FontFileIdGenerator {
	generate: (input: {
		originalUrl: string;
		type: FontType;
		cssVariable: string;
		data: ProxyData;
	}) => string;
}

export interface StringMatcher {
	getClosestMatch: (target: string, candidates: Array<string>) => string;
}

export interface Storage {
	getItem: (key: string) => Promise<any | null>;
	getItemRaw: (key: string) => Promise<Buffer | null>;
	setItem: (key: string, value: any) => Promise<void>;
	setItemRaw: (key: string, value: any) => Promise<void>;
}

export interface FontResolver {
	resolveFont: (
		options: ResolveFontOptions<Record<string, any>> & { provider: string },
	) => Promise<Array<unifont.FontFaceData>>;
	listFonts: (options: { provider: string }) => Promise<string[] | undefined>;
}
