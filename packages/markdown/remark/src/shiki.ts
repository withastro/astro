import { bundledLanguages, getHighlighter } from 'shikiji';
import { visit } from 'unist-util-visit';
import type { ShikiConfig } from './types.js';

export interface ShikiHighlighter {
	highlight(code: string, lang?: string, options?: { inline?: boolean }): string;
}

const ASTRO_COLOR_REPLACEMENTS: Record<string, string> = {
	'#000001': 'var(--astro-code-color-text)',
	'#000002': 'var(--astro-code-color-background)',
	'#000004': 'var(--astro-code-token-constant)',
	'#000005': 'var(--astro-code-token-string)',
	'#000006': 'var(--astro-code-token-comment)',
	'#000007': 'var(--astro-code-token-keyword)',
	'#000008': 'var(--astro-code-token-parameter)',
	'#000009': 'var(--astro-code-token-function)',
	'#000010': 'var(--astro-code-token-string-expression)',
	'#000011': 'var(--astro-code-token-punctuation)',
	'#000012': 'var(--astro-code-token-link)',
};
const COLOR_REPLACEMENT_REGEX = new RegExp(
	`(${Object.keys(ASTRO_COLOR_REPLACEMENTS).join('|')})`,
	'g'
);

export async function createShikiHighlighter({
	langs = [],
	theme = 'github-dark',
	experimentalThemes = {},
	wrap = false,
}: ShikiConfig = {}): Promise<ShikiHighlighter> {
	const themes = experimentalThemes;

	const highlighter = await getHighlighter({
		langs: langs.length ? langs : Object.keys(bundledLanguages),
		themes: Object.values(themes).length ? Object.values(themes) : [theme],
	});

	const loadedLanguages = highlighter.getLoadedLanguages();

	return {
		highlight(code, lang = 'plaintext', options) {
			if (lang !== 'plaintext' && !loadedLanguages.includes(lang)) {
				// eslint-disable-next-line no-console
				console.warn(`[Shiki] The language "${lang}" doesn't exist, falling back to "plaintext".`);
				lang = 'plaintext';
			}

			const themeOptions = Object.values(themes).length ? { themes } : { theme };
			const inline = options?.inline ?? false;

			return highlighter.codeToHtml(code, {
				...themeOptions,
				lang,
				transforms: {
					pre(node) {
						// Swap to `code` tag if inline
						if (inline) {
							node.tagName = 'code';
						}

						// Cast to string as shikiji will always pass them as strings instead of any other types
						const classValue = (node.properties.class as string) ?? '';
						const styleValue = (node.properties.style as string) ?? '';

						// Replace "shiki" class naming with "astro-code"
						node.properties.class = classValue.replace(/shiki/g, 'astro-code');

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
						if (lang === 'diff') {
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
						if (Object.values(experimentalThemes).length) {
							return;
						}

						// theme.id for shiki -> shikiji compat
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
			});
		},
	};
}

/**
 * shiki -> shikiji compat as we need to manually replace it
 * @internal Exported for error overlay use only
 */
export function replaceCssVariables(str: string) {
	return str.replace(COLOR_REPLACEMENT_REGEX, (match) => ASTRO_COLOR_REPLACEMENTS[match] || match);
}
