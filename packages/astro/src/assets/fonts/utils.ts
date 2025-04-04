import type * as unifont from 'unifont';
import type {
	BuiltInProvider,
	FontFamily,
	FontProvider,
	FontType,
	ResolvedFontFamily,
} from './types.js';
import { extname } from 'node:path';
import {
	DEFAULT_FALLBACKS,
	FONT_TYPES,
	GOOGLE_PROVIDER_NAME,
	LOCAL_PROVIDER_NAME,
} from './constants.js';
import type { Storage } from 'unstorage';
import type { FontFaceMetrics, generateFallbackFontFace } from './metrics.js';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { resolveProvider, type ResolveProviderOptions } from './providers/utils.js';
import { google } from './providers/google.js';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Source: https://github.com/nuxt/fonts/blob/main/src/css/render.ts#L7-L21
export function generateFontFace(family: string, font: unifont.FontFaceData) {
	return [
		'@font-face {',
		`  font-family: ${family};`,
		`  src: ${renderFontSrc(font.src)};`,
		`  font-display: ${font.display ?? 'swap'};`,
		font.unicodeRange && `  unicode-range: ${font.unicodeRange};`,
		font.weight &&
			`  font-weight: ${Array.isArray(font.weight) ? font.weight.join(' ') : font.weight};`,
		font.style && `  font-style: ${font.style};`,
		font.stretch && `  font-stretch: ${font.stretch};`,
		font.featureSettings && `  font-feature-settings: ${font.featureSettings};`,
		font.variationSettings && `  font-variation-settings: ${font.variationSettings};`,
		`}`,
	]
		.filter(Boolean)
		.join('\n');
}

// Source: https://github.com/nuxt/fonts/blob/main/src/css/render.ts#L68-L81
function renderFontSrc(sources: Exclude<unifont.FontFaceData['src'][number], string>[]) {
	return sources
		.map((src) => {
			if ('url' in src) {
				let rendered = `url("${src.url}")`;
				for (const key of ['format', 'tech'] as const) {
					if (key in src) {
						rendered += ` ${key}(${src[key]})`;
					}
				}
				return rendered;
			}
			return `local("${src.name}")`;
		})
		.join(', ');
}

export function extractFontType(str: string): FontType {
	// Extname includes a leading dot
	const extension = extname(str).slice(1);
	if (!isFontType(extension)) {
		throw new AstroError(AstroErrorData.CannotExtractFontType, {
			cause: `Unexpected extension, got "${extension}"`,
		});
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
): Promise<{ cached: boolean; data: Buffer }> {
	const existing = await storage.getItemRaw(key);
	if (existing) {
		return { cached: true, data: existing };
	}
	const data = await cb();
	await storage.setItemRaw(key, data);
	return { cached: false, data };
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
} | null;

export type GetMetricsForFamily = (
	name: string,
	/** A remote url or local filepath to a font file. Used if metrics can't be resolved purely from the family name */
	font: GetMetricsForFamilyFont,
) => Promise<FontFaceMetrics | null>;

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
	font: GetMetricsForFamilyFont;
	metrics: {
		getMetricsForFamily: GetMetricsForFamily;
		generateFontFace: typeof generateFallbackFontFace;
	} | null;
}): Promise<null | { css: string; fallbacks: Array<string> }> {
	// We avoid mutating the original array
	let fallbacks = [..._fallbacks];
	if (fallbacks.length === 0) {
		return null;
	}

	let css = '';

	if (!metrics) {
		return { css, fallbacks };
	}

	// The last element of the fallbacks is usually a generic family name (eg. serif)
	const lastFallback = fallbacks[fallbacks.length - 1];
	// If it's not a generic family name, we can't infer local fonts to be used as fallbacks
	if (!isGenericFontFamily(lastFallback)) {
		return { css, fallbacks };
	}

	// If it's a generic family name, we get the associated local fonts (eg. Arial)
	const localFonts = DEFAULT_FALLBACKS[lastFallback];
	// Some generic families do not have associated local fonts so we abort early
	if (localFonts.length === 0) {
		return { css, fallbacks };
	}

	const foundMetrics = await metrics.getMetricsForFamily(family.name, fontData);
	if (!foundMetrics) {
		// If there are no metrics, we can't generate useful fallbacks
		return { css, fallbacks };
	}

	const localFontsMappings = localFonts.map((font) => ({
		font,
		name: `"${family.nameWithHash} fallback: ${font}"`,
	}));

	// We prepend the fallbacks with the local fonts and we dedupe in case a local font is already provided
	fallbacks = [...new Set([...localFontsMappings.map((m) => m.name), ...fallbacks])];

	for (const { font, name } of localFontsMappings) {
		css += metrics.generateFontFace(foundMetrics, { font, name });
	}

	return { css, fallbacks };
}

function isLocalFontFamily(family: FontFamily<any>): family is FontFamily<'local'> {
	return family.provider === LOCAL_PROVIDER_NAME || (!family.provider && 'variants' in family);
}

function dedupe<const T extends Array<any>>(arr: T): T {
	return [...new Set(arr)] as T;
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
}: Omit<ResolveProviderOptions, 'provider'> & {
	family: FontFamily<BuiltInProvider | FontProvider>;
	generateNameWithHash: (family: FontFamily<any>) => string;
}): Promise<ResolvedFontFamily> {
	const nameWithHash = generateNameWithHash(family);

	if (isLocalFontFamily(family)) {
		return {
			...family,
			nameWithHash,
			provider: LOCAL_PROVIDER_NAME,
			variants: family.variants.map((variant) => ({
				...variant,
				weight: variant.weight.toString(),
				src: variant.src.map((value) => {
					const isValue = typeof value === 'string' || value instanceof URL;
					const url = (isValue ? value : value.url).toString();
					const tech = isValue ? undefined : value.tech;
					return {
						url: fileURLToPath(resolveEntrypoint(root, url)),
						tech,
					};
				}),
			})),
			fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		};
	}

	const provider =
		family.provider === GOOGLE_PROVIDER_NAME || !family.provider ? google() : family.provider;

	return {
		...family,
		nameWithHash,
		provider: await resolveProvider({
			root,
			resolveMod,
			provider,
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
		if (hashes.has(hash)) {
			continue;
		}
		// Makes sure every font uses the right instance of a given provider
		// if this provider is provided several times with different options
		// We have to mutate the unifont provider name because unifont deduplicates
		// based on the name.
		unifontProvider._name += `-${hash}`;
		// We set the provider name so we can tell unifont what provider to use when
		// resolving font faces
		provider.name = unifontProvider._name;
		hashes.add(hash);
		providers.push(unifontProvider);
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
