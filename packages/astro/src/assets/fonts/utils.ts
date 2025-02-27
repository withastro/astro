import type * as unifont from 'unifont';
import type { FontType } from './types.js';
import { extname } from 'node:path';
import { DEFAULT_FALLBACKS, FONT_TYPES } from './constants.js';
import type { Storage } from 'unstorage';
import type * as fontaine from 'fontaine';

// TODO: expose all relevant options in config
// Source: https://github.com/nuxt/fonts/blob/main/src/css/render.ts#L7-L21
export function generateFontFace(family: string, font: unifont.FontFaceData) {
	return [
		'@font-face {',
		`  font-family: '${family}';`,
		`  src: ${renderFontSrc(font.src)};`,
		`  font-display: ${font.display || 'swap'};`,
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
		// TODO: AstroError
		throw new Error("Can't extract font type");
	}
	return extension;
}

export function isFontType(str: string): str is FontType {
	return (FONT_TYPES as Readonly<Array<string>>).includes(str);
}

export function createCache(storage: Storage) {
	return async function cache(
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
	};
}

export type CacheHandler = ReturnType<typeof createCache>;

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

type FontFaceMetrics = Parameters<typeof fontaine.generateFontFace>[0];

/**
 * Generates CSS for a given family fallbacks if possible.
 *
 * It works by trying to get metrics (using fontaine) of the provided font family.
 * If some can be computed, they will be applied to the eligible fallbacks to match
 * the original font shape as close as possible.
 */
export async function generateFallbacksCSS({
	family,
	fallbacks: _fallbacks,
	fontURL,
	getMetricsForFamily,
	// eslint-disable-next-line @typescript-eslint/no-shadow
	generateFontFace,
}: {
	/** The family name */
	family: string;
	/** The family fallbacks */
	fallbacks: Array<string>;
	/** A remote url or local filepath to a font file. Used if metrics can't be resolved purely from the family name */
	fontURL: string | null;
	getMetricsForFamily: (family: string, fontURL: string | null) => Promise<null | FontFaceMetrics>;
	generateFontFace: typeof fontaine.generateFontFace;
}): Promise<null | { css: string; fallbacks: Array<string> }> {
	// We avoid mutating the original array
	let fallbacks = [..._fallbacks];
	if (fallbacks.length === 0) {
		return null;
	}

	let css = '';
	const metrics = await getMetricsForFamily(family, fontURL);
	// If there are no metrics, we can't generate useful fallbacks
	if (!metrics) {
		return { css, fallbacks };
	}

	// TODO: to be documented
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

	// We prepend the fallbacks with the local fonts and we dedupe in case a local font is already provided
	fallbacks = [...new Set([...localFonts, ...fallbacks])];

	for (const fallback of localFonts) {
		css += generateFontFace(metrics, {
			font: fallback,
			// TODO: support family.as
			name: `${family} fallback: ${fallback}`,
			metrics: (await getMetricsForFamily(fallback, null)) ?? undefined,
		});
	}

	return { css, fallbacks };
}
