import type * as unifont from 'unifont';
import type { FontFamilyAttributes, FontType } from './types.js';
import { extname } from 'node:path';
import { DEFAULT_FALLBACKS, FONT_TYPES } from './constants.js';
import type { Storage } from 'unstorage';
import type { Logger } from '../../core/logger/core.js';
import type { FontFaceMetrics, generateFallbackFontFace } from './metrics.js';

// Source: https://github.com/nuxt/fonts/blob/main/src/css/render.ts#L7-L21
export function generateFontFace(family: string, font: unifont.FontFaceData) {
	return [
		'@font-face {',
		`  font-family: ${JSON.stringify(family)};`,
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
		// TODO: AstroError
		throw new Error("Can't extract font type");
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
	family: {
		name: string;
		as?: string;
	};
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
		name: `"${getFamilyName(family)} fallback: ${font}"`,
	}));

	// We prepend the fallbacks with the local fonts and we dedupe in case a local font is already provided
	fallbacks = [...new Set([...localFontsMappings.map((m) => m.name), ...fallbacks])];

	for (const { font, name } of localFontsMappings) {
		css += metrics.generateFontFace(foundMetrics, { font, name });
	}

	return { css, fallbacks };
}

/**
 * We want to show logs related to font downloading (fresh or from cache)
 * However if we just use the logger as is, there are too many logs, and not
 * so useful.
 * This log manager allows avoiding repetitive logs:
 * - If there are many downloads started at once, only one log is shown for start and end
 * - If a given file has already been logged, it won't show up anymore (useful in dev)
 */
export function createLogManager(logger: Logger) {
	const done = new Set<string>();
	const items = new Set<string>();
	let id: NodeJS.Timeout | null = null;

	return {
		add: (value: string) => {
			if (done.has(value)) {
				return;
			}

			if (items.size === 0 && id === null) {
				logger.info('assets', 'Downloading fonts...');
			}
			items.add(value);
			if (id) {
				clearTimeout(id);
				id = null;
			}
		},
		remove: (value: string, cached: boolean) => {
			if (done.has(value)) {
				return;
			}

			items.delete(value);
			done.add(value);
			if (id) {
				clearTimeout(id);
				id = null;
			}
			id = setTimeout(() => {
				let msg = 'Done';
				if (cached) {
					msg += ' (loaded from cache)';
				}
				logger.info('assets', msg);
			}, 50);
		},
	};
}

const CAMEL_CASE_REGEX = /([a-z])([A-Z])/g;
const NON_ALPHANUMERIC_REGEX = /[^a-zA-Z0-9]+/g;
const TRIM_DASHES_REGEX = /^-+|-+$/g;

export function kebab(value: string) {
	return value
		.replace(CAMEL_CASE_REGEX, '$1-$2') // Handle camelCase
		.replace(NON_ALPHANUMERIC_REGEX, '-') // Replace non-alphanumeric characters with dashes
		.replace(TRIM_DASHES_REGEX, '') // Trim leading/trailing dashes
		.toLowerCase();
}

export function getFamilyName(family: Pick<FontFamilyAttributes, 'name' | 'as'>): string {
	return family.as ?? family.name;
}
