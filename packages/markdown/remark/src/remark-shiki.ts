import type * as shiki from 'shiki';
import { getHighlighter } from 'shiki';
import { visit } from 'unist-util-visit';
import type { ShikiConfig } from './types.js';

/**
 * getHighlighter() is the most expensive step of Shiki. Instead of calling it on every page,
 * cache it here as much as possible. Make sure that your highlighters can be cached, state-free.
 * We make this async, so that multiple calls to parse markdown still share the same highlighter.
 */
const highlighterCacheAsync = new Map<string, Promise<shiki.Highlighter>>();

// Map of old theme names to new names to preserve compatibility when we upgrade shiki
const compatThemes: Record<string, string> = {
	'material-darker': 'material-theme-darker',
	'material-default': 'material-theme',
	'material-lighter': 'material-theme-lighter',
	'material-ocean': 'material-theme-ocean',
	'material-palenight': 'material-theme-palenight',
};

const normalizeTheme = (theme: string | shiki.IShikiTheme) => {
	if (typeof theme === 'string') {
		return compatThemes[theme] || theme;
	} else if (compatThemes[theme.name]) {
		return { ...theme, name: compatThemes[theme.name] };
	} else {
		return theme;
	}
};

const remarkShiki = async (
	{ langs = [], theme = 'github-dark', wrap = false }: ShikiConfig,
	scopedClassName?: string | null
) => {
	theme = normalizeTheme(theme);
	const cacheID: string = typeof theme === 'string' ? theme : theme.name;
	let highlighterAsync = highlighterCacheAsync.get(cacheID);
	if (!highlighterAsync) {
		highlighterAsync = getHighlighter({ theme }).then((hl) => {
			hl.setColorReplacements({
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
			});
			return hl;
		});
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
			let lang: string;

			if (typeof node.lang === 'string') {
				const langExists = highlighter.getLoadedLanguages().includes(node.lang);
				if (langExists) {
					lang = node.lang;
				} else {
					// eslint-disable-next-line no-console
					console.warn(`The language "${node.lang}" doesn't exist, falling back to plaintext.`);
					lang = 'plaintext';
				}
			} else {
				lang = 'plaintext';
			}

			let html = highlighter!.codeToHtml(node.value, { lang });

			// Q: Couldn't these regexes match on a user's inputted code blocks?
			// A: Nope! All rendered HTML is properly escaped.
			// Ex. If a user typed `<span class="line"` into a code block,
			// It would become this before hitting our regexes:
			// &lt;span class=&quot;line&quot;

			// Replace "shiki" class naming with "astro" and add "is:raw".
			html = html.replace(
				/<pre class="(.*?)shiki(.*?)"/,
				`<pre is:raw class="$1astro-code$2${scopedClassName ? ' ' + scopedClassName : ''}"`
			);
			// Add "user-select: none;" for "+"/"-" diff symbols
			if (node.lang === 'diff') {
				html = html.replace(
					/<span class="line"><span style="(.*?)">([\+|\-])/g,
					'<span class="line"><span style="$1"><span style="user-select: none;">$2</span>'
				);
			}
			// Handle code wrapping
			// if wrap=null, do nothing.
			if (wrap === false) {
				html = html.replace(/style="(.*?)"/, 'style="$1; overflow-x: auto;"');
			} else if (wrap === true) {
				html = html.replace(
					/style="(.*?)"/,
					'style="$1; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;"'
				);
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
