import type { Properties, Root } from 'hast';
import {
	type BundledLanguage,
	createCssVariablesTheme,
	createHighlighter,
	type HighlighterCoreOptions,
	isSpecialLang,
	type LanguageRegistration,
	type ShikiTransformer,
	type ThemeRegistration,
	type ThemeRegistrationRaw,
} from 'shiki';
import type { ShikiConfig, ThemePresets } from './types.js';

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

let _cssVariablesTheme: ReturnType<typeof createCssVariablesTheme>;
const cssVariablesTheme = () =>
	_cssVariablesTheme ??
	(_cssVariablesTheme = createCssVariablesTheme({
		variablePrefix: '--astro-code-',
	}));

/**
 *
 * @deprecated Use `getCachedHighlighter` instead.
 */
export async function createShikiHighlighter({
	langs = [],
	theme = 'github-dark',
	themes = {},
	langAlias = {},
}: CreateShikiHighlighterOptions = {}): Promise<ShikiHighlighter> {
	theme = theme === 'css-variables' ? cssVariablesTheme() : theme;

	const highlighter = await createHighlighter({
		langs: ['plaintext', ...langs],
		langAlias,
		themes: Object.values(themes).length ? Object.values(themes) : [theme],
	});

	async function highlight(
		code: string,
		lang = 'plaintext',
		options: ShikiHighlighterHighlightOptions,
		to: 'hast' | 'html',
	) {
		const resolvedLang = langAlias[lang] ?? lang;
		const loadedLanguages = highlighter.getLoadedLanguages();

		if (!isSpecialLang(lang) && !loadedLanguages.includes(resolvedLang)) {
			try {
				await highlighter.loadLanguage(resolvedLang as BundledLanguage);
			} catch (_err) {
				const langStr =
					lang === resolvedLang ? `"${lang}"` : `"${lang}" (aliased to "${resolvedLang}")`;
				console.warn(`[Shiki] The language ${langStr} doesn't exist, falling back to "plaintext".`);
				lang = 'plaintext';
			}
		}

		code = code.replace(/(?:\r\n|\r|\n)$/, '');

		const themeOptions = Object.values(themes).length ? { themes } : { theme };
		const inline = options?.inline ?? false;

		return highlighter[to === 'html' ? 'codeToHtml' : 'codeToHast'](code, {
			...themeOptions,
			defaultColor: options.defaultColor,
			lang,
			// NOTE: while we can spread `options.attributes` here so that Shiki can auto-serialize this as rendered
			// attributes on the top-level tag, it's not clear whether it is fine to pass all attributes as meta, as
			// they're technically not meta, nor parsed from Shiki's `parseMetaString` API.
			meta: options?.meta ? { __raw: options?.meta } : undefined,
			transformers: [
				{
					pre(node) {
						// Swap to `code` tag if inline
						if (inline) {
							node.tagName = 'code';
						}

						const {
							class: attributesClass,
							style: attributesStyle,
							...rest
						} = options?.attributes ?? {};
						Object.assign(node.properties, rest);

						const classValue =
							(normalizePropAsString(node.properties.class) ?? '') +
							(attributesClass ? ` ${attributesClass}` : '');
						const styleValue =
							(normalizePropAsString(node.properties.style) ?? '') +
							(attributesStyle ? `; ${attributesStyle}` : '');

						// Replace "shiki" class naming with "astro-code"
						node.properties.class = classValue.replace(/shiki/g, 'astro-code');

						// Add data-language attribute
						node.properties.dataLanguage = lang;

						// Handle code wrapping
						// if wrap=null, do nothing.
						if (options.wrap === false || options.wrap === undefined) {
							node.properties.style = styleValue + '; overflow-x: auto;';
						} else if (options.wrap === true) {
							node.properties.style =
								styleValue + '; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;';
						}
					},
					line(node) {
						// Add "user-select: none;" for "+"/"-" diff symbols.
						// Transform `<span class="line"><span style="...">+ something</span></span>
						// into      `<span class="line"><span style="..."><span style="user-select: none;">+</span> something</span></span>`
						if (resolvedLang === 'diff') {
							const innerSpanNode = node.children[0];
							const innerSpanTextNode =
								innerSpanNode?.type === 'element' && innerSpanNode.children?.[0];

							if (innerSpanTextNode && innerSpanTextNode.type === 'text') {
								const start = innerSpanTextNode.value[0];
								if (start === '+' || start === '-') {
									innerSpanTextNode.value = innerSpanTextNode.value.slice(1);
									innerSpanNode.children.unshift({
										type: 'element',
										tagName: 'span',
										properties: { style: 'user-select: none;' },
										children: [{ type: 'text', value: start }],
									});
								}
							}
						}
					},
					code(node) {
						if (inline) {
							return node.children[0] as typeof node;
						}
					},
				},
				...(options.transformers ?? []),
			],
		});
	}

	return {
		codeToHast(code, lang, options = {}) {
			return highlight(code, lang, options, 'hast') as Promise<Root>;
		},
		codeToHtml(code, lang, options = {}) {
			return highlight(code, lang, options, 'html') as Promise<string>;
		},
	};
}

function normalizePropAsString(value: Properties[string]): string | null {
	return Array.isArray(value) ? value.join(' ') : (value as string | null);
}

// Caches Promise<ShikiHighlighter> for reuse when the same theme and langs are provided
const cachedHighlighters = new Map();

export function getCachedHighlighter(opts: ShikiConfig): Promise<ShikiHighlighter> {
	// Always sort keys before stringifying to make sure objects match regardless of parameter ordering
	const key = JSON.stringify(opts, Object.keys(opts).sort());

	// Highlighter has already been requested, reuse the same instance
	if (cachedHighlighters.has(key)) {
		return cachedHighlighters.get(key);
	}

	const highlighter = createShikiHighlighter(opts);
	cachedHighlighters.set(key, highlighter);

	return highlighter;
}

// #region Shiki transformer code
// Adapted from https://github.com/shikijs/shiki/blob/main/packages/transformers/src/transformers/style-to-class.ts
export function getStyleToCssTransformer(): ShikiTransformer & {
	getCss(): string;
	clearRegistry(): void;
} {
	function registerStyle(style: Record<string, string> | string): string {
		const str = typeof style === 'string' ? style : stringifyStyle(style);
		let className = '__a_' + cyrb53(str);
		if (!classToStyle.has(className)) {
			classToStyle.set(className, typeof style === 'string' ? style : { ...style });
		}
		return className;
	}

	return {
		pre(node) {
			const className = registerStyle(node.properties.style as string);
			this.addClassToHast(node, className);
		},
		tokens(lines) {
			for (const line of lines) {
				for (const token of line) {
					if (token.color) {
						const className = registerStyle({ color: token.color });
						token.htmlStyle = {};
						token.htmlAttrs ||= {};
						if (!token.htmlAttrs.class) token.htmlAttrs.class = className;
						else token.htmlAttrs.class += ` ${className}`;
					}
				}
			}
		},

		/**
		 * Returns the generated CSS.
		 */
		getCss(): string {
			let css = '';
			for (const [className, style] of classToStyle.entries()) {
				css += `.${className}{${typeof style === 'string' ? style : stringifyStyle(style)}}`;
			}
			return css;
		},

		/**
		 * Clears the registry.
		 */
		clearRegistry() {
			classToStyle.clear();
		},
	};
}

const classToStyle = new Map<string, Record<string, string> | string>();

function stringifyStyle(style: Record<string, string>): string {
	return Object.entries(style)
		.map(([key, value]) => `${key}:${value}`)
		.join(';');
}

export function getTransformedCss() {
	let css = '';
	for (const [className, style] of classToStyle.entries()) {
		css += `.${className}{${typeof style === 'string' ? style : stringifyStyle(style)}}`;
	}
	return css;
}

/**
 * A simple hash function.
 *
 * @see https://stackoverflow.com/a/52171480
 */
function cyrb53(str: string, seed = 0): string {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).slice(0, 6);
}
