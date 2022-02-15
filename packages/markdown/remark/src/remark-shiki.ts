import shiki from 'shiki';
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
	const highlighter = await shiki.getHighlighter({ theme });

	for (const lang of langs) {
		await highlighter.loadLanguage(lang);
	}

	return () => (tree: any) => {
		visit(tree, 'code', (node) => {
			const lineOptions = parseLineOptions(node.meta);
			let html = highlighter.codeToHtml(node.value, { lang: node.lang ?? 'plaintext', lineOptions });

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

/**
 * Parse codeblock meta to lineOptions.
 *
 * We can specify highlighted line ranges within the language meta string (leave a space after the language).
 * To highlight multiple lines, separate the line numbers by commas or use the range syntax to select a
 * chunk of lines.
 *
 * This approach is referring to the Docusaurus.
 * https://docusaurus.io/docs/markdown-features/code-blocks#highlighting-with-metadata-string
 */
function parseLineOptions(string: string): shiki.HtmlRendererOptions['lineOptions'] {
	if (string == null) {
		return [];
	}

	const metaItems = string.split(' ');
	if (metaItems.length === 0) {
		return [];
	}
	const highlightLineMeta = metaItems.find((meta) => /^{[\d,\-]+}$/.test(meta));
	if (highlightLineMeta == null) {
		return [];
	}

	// Following code is referring to parse-number-range library.
 	// [parse-number-range](https://github.com/euank/node-parse-numeric-range/blob/6728dcfb8b4681eb6986ce7ca13a2ee190222fcc/index.js) library
	let res = [];
	let m;

	for (let str of highlightLineMeta
		.replace(/[{}]/g, '')
		.split(',')
		.map((str) => str.trim())) {
		// just a number
		if (/^-?\d+$/.test(str)) {
			res.push(parseInt(str, 10));
		} else if ((m = str.match(/^(-?\d+)(-|\.\.\.?|\u2025|\u2026|\u22EF)(-?\d+)$/))) {
			// 1-5 or 1..5 (equivalent) or 1...5 (doesn't include 5)
			let [_, lhs, sep, rhs] = m;

			if (lhs && rhs) {
				let lhsI = parseInt(lhs);
				let rhsI = parseInt(rhs);
				const incr = lhsI < rhsI ? 1 : -1;

				// Make it inclusive by moving the right 'stop-point' away by one.
				if (sep === '-' || sep === '..' || sep === '\u2025') rhsI += incr;

				for (let i = lhsI; i !== rhsI; i += incr) res.push(i);
			}
		}
	}
	// Map highlight line numbers to expected type `shiki.HtmlRendererOptions['lineOptions']`
	// The className of the highlighter is fixed to 'highlighted'. You may want to make it
	// an option so that you can change it.
	return res.map((lineNumber) => ({ line: lineNumber, classes: ['highlighted'] }));
}

export default remarkShiki;
