import type * as unifont from 'unifont';
import type { CssProperties, FontType, GenericFallbackName } from './types.js';
/**
 * Turns unifont font face data into generic CSS properties, to be consumed by the CSS renderer.
 */
export declare function unifontFontFaceDataToProperties(
	font: Partial<unifont.FontFaceData>,
): CssProperties;
export declare function renderFontWeight(
	weight: unifont.FontFaceData['weight'],
): string | undefined;
/**
 * Turns unifont font face data src into a valid CSS property.
 * Adapted from https://github.com/nuxt/fonts/blob/main/src/css/render.ts#L68-L81
 */
export declare function renderFontSrc(
	sources: Exclude<unifont.FontFaceData['src'][number], string>[],
): string;
/**
 * Removes the quotes from a string. Used for family names
 */
export declare function withoutQuotes(str: string): string;
export declare function isFontType(str: string): str is FontType;
export declare function isGenericFontFamily(str: string): str is GenericFallbackName;
export declare function dedupe<const T extends Array<any>>(arr: T): T;
export declare function sortObjectByKey<T extends Record<string, any>>(unordered: T): T;
