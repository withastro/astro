import type { ShikiConfig } from 'astro';
/** @ts-expect-error "Cannot find module 'astro/jsx-runtime'" */
import { Fragment } from 'astro/jsx-runtime';
import Markdoc, { type ConfigType } from '@markdoc/markdoc';
import type * as shiki from 'shiki';
import { getHighlighter } from 'shiki';

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

let cachedHighlighter: shiki.Highlighter;

export async function createShikiConfig({
	langs = [],
	theme = 'github-dark',
	wrap = false,
}: ShikiConfig): Promise<ConfigType> {
	theme = normalizeTheme(theme);
	if (!cachedHighlighter) {
		cachedHighlighter = await getHighlighter({ theme }).then((hl) => {
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
	}

	for (const lang of langs) {
		await cachedHighlighter.loadLanguage(lang);
	}
	return {
		nodes: {
			fence: {
				attributes: {
					content: { type: String, required: true },
					language: { type: String },
					process: { type: Boolean },
				},
				transform(node, config) {
					const attributes = node.transformAttributes(config);

					let lang: string;

					if (typeof attributes.language === 'string') {
						const langExists = cachedHighlighter
							.getLoadedLanguages()
							.includes(attributes.language as any);
						if (langExists) {
							lang = attributes.language;
						} else {
							// eslint-disable-next-line no-console
							console.warn(
								`The language "${attributes.language}" doesn't exist, falling back to plaintext.`
							);
							lang = 'plaintext';
						}
					} else {
						lang = 'plaintext';
					}

					let html = cachedHighlighter.codeToHtml(attributes.content, { lang });

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

					const htmlFragment = new Markdoc.Tag(Fragment, { 'set:html': html }, []);

					return new Markdoc.Tag('pre', attributes, [htmlFragment]);
				},
			},
		},
	};
}
