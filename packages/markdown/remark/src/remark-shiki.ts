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

/**
 * getHighlighter() is the most expensive step of Shiki. Instead of calling it on every page,
 * cache it here as much as possible. Make sure that your highlighters can be cached, state-free.
 * We make this async, so that multiple calls to parse markdown still share the same highlighter.
 */
const highlighterCacheAsync = new Map<string, Promise<shiki.Highlighter>>();

const remarkShiki = async ({ langs = [], theme = 'github-dark', wrap = false }: ShikiConfig, scopedClassName?: string | null) => {
	const cacheID: string = typeof theme === 'string' ? theme : theme.name;
	let highlighterAsync = highlighterCacheAsync.get(cacheID);
	if (!highlighterAsync) {
		highlighterAsync = getHighlighter({ theme });
		highlighterCacheAsync.set(cacheID, highlighterAsync);
	}
	const highlighter = await highlighterAsync;

	// NOTE: There may be a performance issue here for large sites that use `lang`.
	// Since this will be called on every page load. Unclear how to fix this.
	for (const lang of langs) {
		await highlighter.loadLanguage(lang);
	}

	return () => (tree: any) => {
		visit(tree, 'code', (node) => {
			let html = highlighter!.codeToHtml(node.value, { lang: node.lang ?? 'plaintext' });

			// Q: Couldn't these regexes match on a user's inputted code blocks?
			// A: Nope! All rendered HTML is properly escaped.
			// Ex. If a user typed `<span class="line"` into a code block,
			// It would become this before hitting our regexes:
			// &lt;span class=&quot;line&quot;

			// Replace "shiki" class naming with "astro" and add "is:raw".
			html = html.replace('<pre class="shiki"', `<pre is:raw class="astro-code${scopedClassName ? ' ' + scopedClassName : ''}"`);
			// Replace "shiki" css variable naming with "astro".
			html = html.replace(/style="(background-)?color: var\(--shiki-/g, 'style="$1color: var(--astro-code-');
			// Handle code wrapping
			// if wrap=null, do nothing.
			if (wrap === false) {
				html = html.replace(/style="(.*?)"/, 'style="$1; overflow-x: auto;"');
			} else if (wrap === true) {
				html = html.replace(/style="(.*?)"/, 'style="$1; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;"');
			}

			// Apply scopedClassName to all nested lines
			if (scopedClassName) {
				html = html.replace(/\<span class="line"\>/g, `<span class="line ${scopedClassName}"`);
			}

			node.type = 'html';
			node.value = html;
			node.children = [];
		});
	};
};

export default remarkShiki;
