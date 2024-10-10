import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { highlightCodeBlocks } from './highlight.js';
import { fromHtml } from 'hast-util-from-html';

export const rehypePrism: Plugin<[], Root> = () => {
	return async (tree) => {
		await highlightCodeBlocks(tree, (code, language) => {
			let { html, classLanguage } = runHighlighterWithAstro(language, code);

			return Promise.resolve(
				fromHtml(`<pre class="${classLanguage}" data-language="${language}"><code is:raw class="${classLanguage}">${html}</code></pre>`)
			);
		});
	};
};
