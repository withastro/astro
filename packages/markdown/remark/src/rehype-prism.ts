import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { highlightCodeBlocks } from './highlight.js';

export const rehypePrism: Plugin<[string[]?], Root> = (excludeLangs) => {
	return async (tree) => {
		await highlightCodeBlocks(
			tree,
			async (code, language) => {
				let { html, classLanguage } = await runHighlighterWithAstro(language, code);

				return `<pre class="${classLanguage}" data-language="${language}"><code class="${classLanguage}">${html}</code></pre>`;
			},
			excludeLangs,
		);
	};
};
