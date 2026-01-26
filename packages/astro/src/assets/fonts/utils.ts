import type * as unifont from 'unifont';
import { FONT_TYPES, GENERIC_FALLBACK_NAMES } from './constants.js';
import type { CssProperties, FontType, GenericFallbackName } from './types.js';

/**
 * Turns unifont font face data into generic CSS properties, to be consumed by the CSS renderer.
 */
export function unifontFontFaceDataToProperties(
	font: Partial<unifont.FontFaceData>,
): CssProperties {
	return {
		src: font.src ? renderFontSrc(font.src) : undefined,
		'font-display': font.display ?? 'swap',
		'unicode-range': font.unicodeRange?.length ? font.unicodeRange.join(',') : undefined,
		'font-weight': renderFontWeight(font.weight),
		'font-style': font.style,
		'font-stretch': font.stretch,
		'font-feature-settings': font.featureSettings,
		'font-variation-settings': font.variationSettings,
	};
}

export function renderFontWeight(weight: unifont.FontFaceData['weight']): string | undefined {
	return Array.isArray(weight) ? weight.join(' ') : weight?.toString();
}

/**
 * Turns unifont font face data src into a valid CSS property.
 * Adapted from https://github.com/nuxt/fonts/blob/main/src/css/render.ts#L68-L81
 */
export function renderFontSrc(
	sources: Exclude<unifont.FontFaceData['src'][number], string>[],
): string {
	return sources
		.map((src) => {
			if ('name' in src) {
				return `local("${src.name}")`;
			}
			let rendered = `url("${src.url}")`;
			if (src.format) {
				rendered += ` format("${src.format}")`;
			}
			if (src.tech) {
				rendered += ` tech(${src.tech})`;
			}
			return rendered;
		})
		.join(', ');
}

const QUOTES_RE = /^["']|["']$/g;

/**
 * Removes the quotes from a string. Used for family names
 */
export function withoutQuotes(str: string): string {
	return str.trim().replace(QUOTES_RE, '');
}

export function isFontType(str: string): str is FontType {
	return (FONT_TYPES as Readonly<Array<string>>).includes(str);
}

export function isGenericFontFamily(str: string): str is GenericFallbackName {
	return (GENERIC_FALLBACK_NAMES as unknown as Array<string>).includes(str);
}

export function dedupe<const T extends Array<any>>(arr: T): T {
	return [...new Set(arr)] as T;
}

export function sortObjectByKey<T extends Record<string, any>>(unordered: T): T {
	const ordered = Object.keys(unordered)
		.sort()
		.reduce((obj, key) => {
			const value = unordered[key];
			// @ts-expect-error Type 'T' is generic and can only be indexed for reading. That's fine here
			obj[key] = Array.isArray(value)
				? value.map((v) => (typeof v === 'object' && v !== null ? sortObjectByKey(v) : v))
				: typeof value === 'object' && value !== null
					? sortObjectByKey(value)
					: value;
			return obj;
		}, {} as T);
	return ordered;
}
