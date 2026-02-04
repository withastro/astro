import type * as unifont from 'unifont';
import type { CollectedFontForMetrics } from './core/optimize-fallbacks.js';
import type {
	CssProperties,
	FontFaceMetrics,
	FontFileData,
	FontProvider,
	FontType,
	GenericFallbackName,
	ResolveFontOptions,
	Style,
} from './types.js';

export interface Hasher {
	hashString: (input: string) => string;
	hashObject: (input: Record<string, any>) => string;
}

export interface UrlResolver {
	resolve: (id: string) => string;
	readonly cspResources: Array<string>;
}

export interface FontFileContentResolver {
	resolve: (url: string) => string;
}

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
		font: unifont.FontFaceData;
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
		options: ResolveFontOptions<Record<string, any>> & { provider: FontProvider },
	) => Promise<Array<unifont.FontFaceData>>;
	listFonts: (options: { provider: FontProvider }) => Promise<string[] | undefined>;
}
