import type * as shiki from 'shiki';
import { getHighlighter } from 'shiki';
import { visit } from 'unist-util-visit';

export interface ShikiConfig {
	/**
	 * The languages loaded to Shiki.
	 * Supports all languages listed here: https://github.com/shikijs/shiki/blob/main/docs/languages.md#all-languages
	 * Instructions for loading a custom language: https://github.com/shikijs/shiki/blob/main/docs/languages.md#supporting-your-own-languages-with-shiki
	 *
	 * @default []
	 */
	langs?: shiki.ILanguageRegistration[];
	/**
	 * The styling theme.
	 * Supports all themes listed here: https://github.com/shikijs/shiki/blob/main/docs/themes.md#all-themes
	 * Instructions for loading a custom theme: https://github.com/shikijs/shiki/blob/main/docs/themes.md#loading-theme
	 *
	 * @default "github-dark"
	 */
	theme?: shiki.IThemeRegistration;
	/**
	 * Enable word wrapping.
	 *  - true: enabled.
	 *  - false: enabled.
	 *  - null: All overflow styling removed. Code will overflow the element by default.
	 *
	 * @default false
	 */
	wrap?: boolean | null;
}

const remarkShiki = async ({ langs = [], theme = 'github-dark', wrap = false }: ShikiConfig) => {
	const highlighter = await getHighlighter({ theme });

	for (const lang of langs) {
		await highlighter.loadLanguage(lang);
	}

	return () => (tree: any) => {
		visit(tree, 'code', (node) => {
			let html = highlighter.codeToHtml(node.value, { lang: node.lang ?? 'plaintext' });

			// Replace "shiki" class naming with "astro" and add "data-astro-raw".
			html = html.replace('<pre class="shiki"', '<pre data-astro-raw class="astro-code"');
			// Replace "shiki" css variable naming with "astro".
			html = html.replace(/style="(background-)?color: var\(--shiki-/g, 'style="$1color: var(--astro-code-');
			// Handle code wrapping
			// if wrap=null, do nothing.
			if (wrap === false) {
				html = html.replace(/style="(.*?)"/, 'style="$1; overflow-x: auto;"');
			} else if (wrap === true) {
				html = html.replace(/style="(.*?)"/, 'style="$1; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;"');
			}

			node.type = 'html';
			node.value = html;
			node.children = [];
		});
	};
};

export default remarkShiki;
