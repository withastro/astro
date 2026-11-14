import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { highlightCodeBlocks } from './highlight.js';

export const rehypePrism: Plugin<[string[]?], Root> = (excludeLangs) => {
	return async (tree) => {
		await highlightCodeBlocks(
			tree,
			async (code, language) => {
				const { html, classLanguage } = await runHighlighterWithAstro(language, code);
				const className = escapeAttribute(classLanguage);

				return `<pre class="${className}" data-language="${escapeAttribute(language)}"><code class="${className}">${html}</code></pre>`;
			},
			excludeLangs,
		);
	};
};

function escapeAttribute(value: string) {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
