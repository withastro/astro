import type { Root } from 'hast';
import {
	type HighlighterCoreOptions,
	type LanguageRegistration,
	type ShikiTransformer,
	type ThemeRegistration,
	type ThemeRegistrationRaw,
} from 'shiki';
import type { ThemePresets } from './types.js';
export interface ShikiHighlighter {
	codeToHast(
		code: string,
		lang?: string,
		options?: ShikiHighlighterHighlightOptions,
	): Promise<Root>;
	codeToHtml(
		code: string,
		lang?: string,
		options?: ShikiHighlighterHighlightOptions,
	): Promise<string>;
}
export interface CreateShikiHighlighterOptions {
	langs?: LanguageRegistration[];
	theme?: ThemePresets | ThemeRegistration | ThemeRegistrationRaw;
	themes?: Record<string, ThemePresets | ThemeRegistration | ThemeRegistrationRaw>;
	langAlias?: HighlighterCoreOptions['langAlias'];
}
export interface ShikiHighlighterHighlightOptions {
	/**
	 * Generate inline code element only, without the pre element wrapper.
	 */
	inline?: boolean;
	/**
	 * Enable word wrapping.
	 * - true: enabled.
	 * - false: disabled.
	 * - null: All overflow styling removed. Code will overflow the element by default.
	 */
	wrap?: boolean | null;
	/**
	 * Chooses a theme from the "themes" option that you've defined as the default styling theme.
	 */
	defaultColor?: 'light' | 'dark' | string | false;
	/**
	 * Shiki transformers to customize the generated HTML by manipulating the hast tree.
	 */
	transformers?: ShikiTransformer[];
	/**
	 * Additional attributes to be added to the root code block element.
	 */
	attributes?: Record<string, string>;
	/**
	 * Raw `meta` information to be used by Shiki transformers.
	 */
	meta?: string;
}
export declare function createShikiHighlighter(
	options?: CreateShikiHighlighterOptions,
): Promise<ShikiHighlighter>;
export type { ThemePresets };
