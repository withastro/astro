import { bundledLanguages, getHighlighter, type Highlighter } from 'shikiji';
import { visit } from 'unist-util-visit';
import type { RemarkPlugin, ShikiConfig } from './types.js';

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

/**
 * getHighlighter() is the most expensive step of Shiki. Instead of calling it on every page,
 * cache it here as much as possible. Make sure that your highlighters can be cached, state-free.
 * We make this async, so that multiple calls to parse markdown still share the same highlighter.
 */
const highlighterCacheAsync = new Map<string, Promise<Highlighter>>();

export function remarkShiki({
	langs = [],
	theme = 'github-dark',
	wrap = false,
}: ShikiConfig = {}): ReturnType<RemarkPlugin> {
	const cacheId =
		(typeof theme === 'string' ? theme : theme.name ?? '') +
		langs.map((l) => l.name ?? (l as any).id).join(',');

	let highlighterAsync = highlighterCacheAsync.get(cacheId);
	if (!highlighterAsync) {
		highlighterAsync = getHighlighter({
			langs: langs.length ? langs : Object.keys(bundledLanguages),
			themes: [theme],
		});
		highlighterCacheAsync.set(cacheId, highlighterAsync);
	}

	return async (tree: any) => {
		const highlighter = await highlighterAsync!;

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

			let html = highlighter.codeToHtml(node.value, { lang, theme });

			// Q: Couldn't these regexes match on a user's inputted code blocks?
			// A: Nope! All rendered HTML is properly escaped.
			// Ex. If a user typed `<span class="line"` into a code block,
			// It would become this before hitting our regexes:
			// &lt;span class=&quot;line&quot;

			// Replace "shiki" class naming with "astro".
			html = html.replace(/<pre class="(.*?)shiki(.*?)"/, `<pre class="$1astro-code$2"`);
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

			// theme.id for shiki -> shikiji compat
			const themeName = typeof theme === 'string' ? theme : theme.name;
			if (themeName === 'css-variables') {
				html = html.replace(/style="(.*?)"/g, (m) => replaceCssVariables(m));
			}

			node.type = 'html';
			node.value = html;
			node.children = [];
		});
	};
}

/**
 * shiki -> shikiji compat as we need to manually replace it
 */
function replaceCssVariables(str: string) {
	return str.replace(COLOR_REPLACEMENT_REGEX, (match) => ASTRO_COLOR_REPLACEMENTS[match] || match);
}
