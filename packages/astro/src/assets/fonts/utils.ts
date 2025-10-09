import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type * as unifont from 'unifont';
import type { Storage } from 'unstorage';
import { FONT_TYPES, GENERIC_FALLBACK_NAMES, LOCAL_PROVIDER_NAME } from './constants.js';
import type { CssProperties } from './definitions.js';
import type { FontType, GenericFallbackName, ResolvedFontFamily } from './types.js';

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

export function resolveEntrypoint(root: URL, entrypoint: string): URL {
	const require = createRequire(root);

	try {
		return pathToFileURL(require.resolve(entrypoint));
	} catch {
		return new URL(entrypoint, root);
	}
}

export function pickFontFaceProperty<
	T extends keyof Pick<
		unifont.FontFaceData,
		'display' | 'unicodeRange' | 'stretch' | 'featureSettings' | 'variationSettings'
	>,
>(property: T, { data, family }: { data: unifont.FontFaceData; family: ResolvedFontFamily }) {
	return data[property] ?? (family.provider === LOCAL_PROVIDER_NAME ? undefined : family[property]);
}
