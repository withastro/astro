import { createRequire } from 'node:module';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type * as unifont from 'unifont';
import type { Storage } from 'unstorage';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { FONT_TYPES, GENERIC_FALLBACK_NAMES, LOCAL_PROVIDER_NAME } from './constants.js';
import type { FontType, GenericFallbackName, ResolvedFontFamily } from './types.js';

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
			obj[key] = typeof value === 'object' && value !== null ? sortObjectByKey(value) : value;
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
