import type { Properties } from 'hast';
import {
	type BundledLanguage,
	createCssVariablesTheme,
	getHighlighter,
	isSpecialLang,
} from 'shiki';
import { visit } from 'unist-util-visit';
import type { ShikiConfig } from './types.js';

export interface ShikiHighlighter {
	highlight(
		code: string,
		lang?: string,
		options?: {
			inline?: boolean;
			attributes?: Record<string, string>;
			/**
			 * Raw `meta` information to be used by Shiki transformers
			 */
			meta?: string;
		},
	): Promise<string>;
}

// TODO: Remove this special replacement in Astro 5
const ASTRO_COLOR_REPLACEMENTS: Record<string, string> = {
	'--astro-code-foreground': '--astro-code-color-text',
	'--astro-code-background': '--astro-code-color-background',
};
const COLOR_REPLACEMENT_REGEX = new RegExp(
	`${Object.keys(ASTRO_COLOR_REPLACEMENTS).join('|')}`,
	'g',
);

let _cssVariablesTheme: ReturnType<typeof createCssVariablesTheme>;
const cssVariablesTheme = () =>
	_cssVariablesTheme ??
	(_cssVariablesTheme = createCssVariablesTheme({ variablePrefix: '--astro-code-' }));

export async function createShikiHighlighter({
	langs = [],
	theme = 'github-dark',
	themes = {},
	defaultColor,
	wrap = false,
	transformers = [],
	langAlias = {},
}: ShikiConfig = {}): Promise<ShikiHighlighter> {
	theme = theme === 'css-variables' ? cssVariablesTheme() : theme;

	const highlighter = await getHighlighter({
		langs: ['plaintext', ...langs],
		langAlias,
		themes: Object.values(themes).length ? Object.values(themes) : [theme],
	});

	return {
		async highlight(code, lang = 'plaintext', options) {
			const resolvedLang = langAlias[lang] ?? lang;
			const loadedLanguages = highlighter.getLoadedLanguages();

			if (!isSpecialLang(lang) && !loadedLanguages.includes(resolvedLang)) {
				try {
					await highlighter.loadLanguage(resolvedLang as BundledLanguage);
				} catch (_err) {
					const langStr =
						lang === resolvedLang ? `"${lang}"` : `"${lang}" (aliased to "${resolvedLang}")`;
					console.warn(
						`[Shiki] The language ${langStr} doesn't exist, falling back to "plaintext".`,
					);
					lang = 'plaintext';
				}
			}

			const themeOptions = Object.values(themes).length ? { themes } : { theme };
			const inline = options?.inline ?? false;

			return highlighter.codeToHtml(code, {
				...themeOptions,
				defaultColor,
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
							if (wrap === false) {
								node.properties.style = styleValue + '; overflow-x: auto;';
							} else if (wrap === true) {
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
						root(node) {
							if (Object.values(themes).length) {
								return;
							}

							const themeName = typeof theme === 'string' ? theme : theme.name;
							if (themeName === 'css-variables') {
								// Replace special color tokens to CSS variables
								visit(node as any, 'element', (child) => {
									if (child.properties?.style) {
										child.properties.style = replaceCssVariables(child.properties.style);
									}
								});
							}
						},
					},
					...transformers,
				],
			});
		},
	};
}

function normalizePropAsString(value: Properties[string]): string | null {
	return Array.isArray(value) ? value.join(' ') : (value as string | null);
}

function replaceCssVariables(str: string) {
	return str.replace(COLOR_REPLACEMENT_REGEX, (match) => ASTRO_COLOR_REPLACEMENTS[match] || match);
}
