// @ts-expect-error Cannot find module 'astro/runtime/server/index.js' or its corresponding type declarations.
import { unescapeHTML } from 'astro/runtime/server/index.js';
import type { ShikiConfig } from 'astro';
import Markdoc, { type Schema } from '@markdoc/markdoc';
import type * as shikiTypes from 'shiki';
import { getHighlighter } from 'shiki';
import type { AstroMarkdocConfig } from '../config';

// Map of old theme names to new names to preserve compatibility when we upgrade shiki
const compatThemes: Record<string, string> = {
	'material-darker': 'material-theme-darker',
	'material-default': 'material-theme',
	'material-lighter': 'material-theme-lighter',
	'material-ocean': 'material-theme-ocean',
	'material-palenight': 'material-theme-palenight',
};

const normalizeTheme = (theme: string | shikiTypes.IShikiTheme) => {
	if (typeof theme === 'string') {
		return compatThemes[theme] || theme;
	} else if (compatThemes[theme.name]) {
		return { ...theme, name: compatThemes[theme.name] };
	} else {
		return theme;
	}
};

/**
 * Cache each Shiki highlighter by theme name.
 * Note: cache only needed for dev server reloads, internal test suites, and manual calls to `Markdoc.transform` by the user.
 * Otherwise, `shiki()` is only called once per build, NOT once per page, so a cache isn't needed!
 */
const highlighterCacheAsync = new Map<string, Promise<shikiTypes.Highlighter>>();

export async function shiki({
	langs = [],
	theme = 'github-dark',
	wrap = false,
}: ShikiConfig = {}): Promise<AstroMarkdocConfig> {
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

	for (const lang of langs) {
		await highlighter.loadLanguage(lang);
	}
	return {
		nodes: {
			fence: {
				attributes: Markdoc.nodes.fence.attributes!,
				transform({ attributes }) {
					let lang: string;

					if (typeof attributes.language === 'string') {
						const langExists = highlighter
							.getLoadedLanguages()
							.includes(attributes.language as any);
						if (langExists) {
							lang = attributes.language;
						} else {
							// eslint-disable-next-line no-console
							console.warn(
								`[Shiki highlighter] The language "${attributes.language}" doesn't exist, falling back to plaintext.`
							);
							lang = 'plaintext';
						}
					} else {
						lang = 'plaintext';
					}

					let html = highlighter.codeToHtml(attributes.content, { lang });

					// Q: Could these regexes match on a user's inputted code blocks?
					// A: Nope! All rendered HTML is properly escaped.
					// Ex. If a user typed `<span class="line"` into a code block,
					// It would become this before hitting our regexes:
					// &lt;span class=&quot;line&quot;

					// Replace "shiki" class naming with "astro-code"
					html = html.replace(/<pre class="(.*?)shiki(.*?)"/, `<pre class="$1astro-code$2"`);
					// Add "user-select: none;" for "+"/"-" diff symbols
					if (attributes.language === 'diff') {
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

					// Return HTML that Astro can render as HTML nodes
					return unescapeHTML(html);
				},
			},
		},
	};
}
