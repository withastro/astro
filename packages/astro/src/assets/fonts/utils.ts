import type * as unifont from 'unifont';
import type { FontType } from './types.js';
import { extname } from 'node:path';
import { DEFAULT_FALLBACKS, FONT_TYPES } from './constants.js';
import type { Storage } from 'unstorage';
import * as fontaine from 'fontaine';

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

// TODO: test
export function isGenericFontFamily(str: string): str is keyof typeof DEFAULT_FALLBACKS {
	return Object.keys(DEFAULT_FALLBACKS).includes(str);
}

// TODO: test
// TODO: jsdoc
export async function generateFallbacksCSS({
	family,
	fallbacks,
	fontURL,
}: {
	family: string;
	fallbacks: Array<string>;
	fontURL: string | null;
}): Promise<null | { css: string; fallbacks: Array<string> }> {
	if (fallbacks.length === 0) {
		return null;
	}

	let metrics = await fontaine.getMetricsForFamily(family);
	if (fontURL && !metrics) {
		metrics = await fontaine.readMetrics(fontURL);
	}

	if (!metrics) {
		return null;
	}

	// TODO: explain what's going on here
	let resolvedFallbacks = [...fallbacks];
	const lastFallback = resolvedFallbacks.at(-1)!;
	let shouldGenerateCss: (fallback: string) => boolean = () => false;
	if (isGenericFontFamily(lastFallback)) {
		const values = DEFAULT_FALLBACKS[lastFallback];
		resolvedFallbacks.unshift(...values);
		shouldGenerateCss = (fallback) => values.includes(fallback);
	}
	resolvedFallbacks = [...new Set(resolvedFallbacks)];

	let css = '';
	for (const fallback of resolvedFallbacks) {
		if (!shouldGenerateCss(fallback)) {
			continue;
		}
		css += fontaine.generateFontFace(metrics, {
			font: fallback,
			// TODO: family.as
			name: `${family} fallback: ${fallback}`,
			metrics: (await fontaine.getMetricsForFamily(fallback)) ?? undefined,
		});
	}

	return { css, fallbacks: resolvedFallbacks };
}
