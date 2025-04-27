import { createRequire } from 'node:module';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type * as unifont from 'unifont';
import type { Storage } from 'unstorage';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { DEFAULT_FALLBACKS, FONT_TYPES, LOCAL_PROVIDER_NAME, SYSTEM_METRICS } from './constants.js';
import type { FontFaceMetrics, generateFallbackFontFace } from './metrics.js';
import { type ResolveProviderOptions, resolveProvider } from './providers/utils.js';
import type {
	FontFamily,
	FontType,
	LocalFontFamily,
	ResolvedFontFamily,
	ResolvedLocalFontFamily,
} from './types.js';

export function toCSS(properties: Record<string, string | undefined>, indent = 2) {
	return Object.entries(properties)
		.filter(([, value]) => Boolean(value))
		.map(([key, value]) => `${' '.repeat(indent)}${key}: ${value};`)
		.join('\n');
}

export function renderFontFace(properties: Record<string, string | undefined>) {
	return `@font-face {\n\t${toCSS(properties)}\n}\n`;
}

function unifontFontFaceDataToProperties(
	font: Partial<unifont.FontFaceData>,
): Record<string, string | undefined> {
	return {
		src: font.src ? renderFontSrc(font.src) : undefined,
		'font-display': font.display ?? 'swap',
		'unicode-range': font.unicodeRange?.join(','),
		'font-weight': Array.isArray(font.weight) ? font.weight.join(' ') : font.weight?.toString(),
		'font-style': font.style,
		'font-stretch': font.stretch,
		'font-feature-settings': font.featureSettings,
		'font-variation-settings': font.variationSettings,
	};
}

export function generateFontFace(family: string, font: unifont.FontFaceData) {
	return renderFontFace({
		'font-family': family,
		...unifontFontFaceDataToProperties(font),
	});
}

// Source: https://github.com/nuxt/fonts/blob/main/src/css/render.ts#L68-L81
export function renderFontSrc(sources: Exclude<unifont.FontFaceData['src'][number], string>[]) {
	return sources
		.map((src) => {
			if ('url' in src) {
				let rendered = `url("${src.url}")`;
				if (src.format) {
					rendered += ` format("${src.format}")`;
				}
				if (src.tech) {
					rendered += ` tech(${src.tech})`;
				}
				return rendered;
			}
			return `local("${src.name}")`;
		})
		.join(', ');
}

const QUOTES_RE = /^["']|["']$/g;

export function withoutQuotes(str: string) {
	return str.trim().replace(QUOTES_RE, '');
}

export function extractFontType(str: string): FontType {
	// Extname includes a leading dot
	const extension = extname(str).slice(1);
	if (!isFontType(extension)) {
		throw new AstroError(
			{
				...AstroErrorData.CannotExtractFontType,
				message: AstroErrorData.CannotExtractFontType.message(str),
			},
			{
				cause: `Unexpected extension, got "${extension}"`,
			},
		);
	}
	return extension;
}

export function isFontType(str: string): str is FontType {
	return (FONT_TYPES as Readonly<Array<string>>).includes(str);
}

export async function cache(
	storage: Storage,
	key: string,
	cb: () => Promise<Buffer>,
): Promise<Buffer> {
	const existing = await storage.getItemRaw(key);
	if (existing) {
		return existing;
	}
	const data = await cb();
	await storage.setItemRaw(key, data);
	return data;
}

export interface ProxyURLOptions {
	/**
	 * The original URL
	 */
	value: string;
	/**
	 * Specifies how the hash is computed. Can be based on the value,
	 * a specific string for testing etc
	 */
	hashString: (value: string) => string;
	/**
	 * Use the hook to save the associated value and hash, and possibly
	 * transform it (eg. apply a base)
	 */
	collect: (data: {
		hash: string;
		type: FontType;
		value: string;
	}) => string;
}

/**
 * The fonts data we receive contains urls or file paths we do no control.
 * However, we will emit font files ourselves so we store the original value
 * and replace it with a url we control. For example with the value "https://foo.bar/file.woff2":
 * - font type is woff2
 * - hash will be "<hash>.woff2"
 * - `collect` will save the association of the original url and the new hash for later use
 * - the returned url will be `/_astro/fonts/<hash>.woff2`
 */
export function proxyURL({ value, hashString, collect }: ProxyURLOptions): string {
	const type = extractFontType(value);
	const hash = `${hashString(value)}.${type}`;
	const url = collect({ hash, type, value });
	// Now that we collected the original url, we return our proxy so the consumer can override it
	return url;
}

export function isGenericFontFamily(str: string): str is keyof typeof DEFAULT_FALLBACKS {
	return Object.keys(DEFAULT_FALLBACKS).includes(str);
}

export type GetMetricsForFamilyFont = {
	hash: string;
	url: string;
	data: Partial<unifont.FontFaceData>;
};

export type GetMetricsForFamily = (
	name: string,
	/** A remote url or local filepath to a font file. Used if metrics can't be resolved purely from the family name */
	font: GetMetricsForFamilyFont,
) => Promise<FontFaceMetrics>;

/**
 * Generates CSS for a given family fallbacks if possible.
 *
 * It works by trying to get metrics (using capsize) of the provided font family.
 * If some can be computed, they will be applied to the eligible fallbacks to match
 * the original font shape as close as possible.
 */
export async function generateFallbacksCSS({
	family,
	fallbacks: _fallbacks,
	font: fontData,
	metrics,
}: {
	family: Pick<ResolvedFontFamily, 'name' | 'nameWithHash'>;
	/** The family fallbacks */
	fallbacks: Array<string>;
	font: Array<GetMetricsForFamilyFont>;
	metrics: {
		getMetricsForFamily: GetMetricsForFamily;
		generateFontFace: typeof generateFallbackFontFace;
	} | null;
}): Promise<null | { css?: string; fallbacks: Array<string> }> {
	// We avoid mutating the original array
	let fallbacks = [..._fallbacks];
	if (fallbacks.length === 0) {
		return null;
	}

	if (fontData.length === 0 || !metrics) {
		return { fallbacks };
	}

	// The last element of the fallbacks is usually a generic family name (eg. serif)
	const lastFallback = fallbacks[fallbacks.length - 1];
	// If it's not a generic family name, we can't infer local fonts to be used as fallbacks
	if (!isGenericFontFamily(lastFallback)) {
		return { fallbacks };
	}

	// If it's a generic family name, we get the associated local fonts (eg. Arial)
	const localFonts = DEFAULT_FALLBACKS[lastFallback];
	// Some generic families do not have associated local fonts so we abort early
	if (localFonts.length === 0) {
		return { fallbacks };
	}

	// If the family is already a system font, no need to generate fallbacks
	if (
		localFonts.includes(
			// @ts-expect-error TS is not smart enough
			family.name,
		)
	) {
		return { fallbacks };
	}

	const localFontsMappings = localFonts.map((font) => ({
		font,
		name: `"${family.nameWithHash} fallback: ${font}"`,
	}));

	// We prepend the fallbacks with the local fonts and we dedupe in case a local font is already provided
	fallbacks = [...new Set([...localFontsMappings.map((m) => m.name), ...fallbacks])];
	let css = '';

	for (const { font, name } of localFontsMappings) {
		for (const { hash, url, data } of fontData) {
			css += metrics.generateFontFace({
				metrics: await metrics.getMetricsForFamily(family.name, { hash, url, data }),
				fallbackMetrics: SYSTEM_METRICS[font],
				font,
				name,
				properties: unifontFontFaceDataToProperties(data),
			});
		}
	}

	return { css, fallbacks };
}

function dedupe<const T extends Array<any>>(arr: T): T {
	return [...new Set(arr)] as T;
}

function resolveVariants({
	variants,
	resolveEntrypoint: _resolveEntrypoint,
}: {
	variants: LocalFontFamily['variants'];
	resolveEntrypoint: (url: string) => string;
}): ResolvedLocalFontFamily['variants'] {
	return variants.map((variant) => ({
		...variant,
		weight: variant.weight.toString(),
		src: variant.src.map((value) => {
			const isValue = typeof value === 'string' || value instanceof URL;
			const url = (isValue ? value : value.url).toString();
			const tech = isValue ? undefined : value.tech;
			return {
				url: _resolveEntrypoint(url),
				tech,
			};
		}),
	}));
}

/**
 * Resolves the font family provider. If none is provided, it will infer the provider as
 * one of the built-in providers and resolve it. The most important part is that if a
 * provider is not provided but `src` is, then it's inferred as the local provider.
 */
export async function resolveFontFamily({
	family,
	generateNameWithHash,
	root,
	resolveMod,
	resolveLocalEntrypoint,
}: Omit<ResolveProviderOptions, 'provider'> & {
	family: FontFamily;
	generateNameWithHash: (family: FontFamily) => string;
	resolveLocalEntrypoint: (url: string) => string;
}): Promise<ResolvedFontFamily> {
	const nameWithHash = generateNameWithHash(family);

	if (family.provider === LOCAL_PROVIDER_NAME) {
		return {
			...family,
			nameWithHash,
			variants: resolveVariants({
				variants: family.variants,
				resolveEntrypoint: resolveLocalEntrypoint,
			}),
			fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		};
	}

	return {
		...family,
		nameWithHash,
		provider: await resolveProvider({
			root,
			resolveMod,
			provider: family.provider,
		}),
		weights: family.weights ? dedupe(family.weights.map((weight) => weight.toString())) : undefined,
		styles: family.styles ? dedupe(family.styles) : undefined,
		subsets: family.subsets ? dedupe(family.subsets) : undefined,
		fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		unicodeRange: family.unicodeRange ? dedupe(family.unicodeRange) : undefined,
	};
}

export function sortObjectByKey<T extends Record<string, any>>(unordered: T): T {
	const ordered = Object.keys(unordered)
		.sort()
		.reduce((obj, key) => {
			// @ts-expect-error Type 'T' is generic and can only be indexed for reading. That's fine here
			obj[key] = unordered[key];
			return obj;
		}, {} as T);
	return ordered;
}

/**
 * Extracts providers from families so they can be consumed by unifont.
 * It deduplicates them based on their config and provider name:
 * - If several families use the same provider (by value, not by reference), we only use one provider
 * - If one provider is used with different settings for 2 families, we make sure there are kept as 2 providers
 */
export function familiesToUnifontProviders({
	families,
	hashString,
}: {
	families: Array<ResolvedFontFamily>;
	hashString: (value: string) => string;
}): { families: Array<ResolvedFontFamily>; providers: Array<unifont.Provider> } {
	const hashes = new Set<string>();
	const providers: Array<unifont.Provider> = [];

	for (const { provider } of families) {
		if (provider === LOCAL_PROVIDER_NAME) {
			continue;
		}

		const unifontProvider = provider.provider(provider.config);
		const hash = hashString(
			JSON.stringify(
				sortObjectByKey({
					name: unifontProvider._name,
					...provider.config,
				}),
			),
		);
		// Makes sure every font uses the right instance of a given provider
		// if this provider is provided several times with different options
		// We have to mutate the unifont provider name because unifont deduplicates
		// based on the name.
		unifontProvider._name += `-${hash}`;
		// We set the provider name so we can tell unifont what provider to use when
		// resolving font faces
		provider.name = unifontProvider._name;

		if (!hashes.has(hash)) {
			hashes.add(hash);
			providers.push(unifontProvider);
		}
	}

	return { families, providers };
}

export function resolveEntrypoint(root: URL, entrypoint: string): URL {
	const require = createRequire(root);

	try {
		return pathToFileURL(require.resolve(entrypoint));
	} catch {
		return new URL(entrypoint, root);
	}
}
