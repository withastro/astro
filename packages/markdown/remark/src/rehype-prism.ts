import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { highlightCodeBlocks } from './highlight.js';

export const rehypePrism: Plugin<[], Root> = () => (tree) => {
	highlightCodeBlocks(tree, (code, language) => {
		let { html, classLanguage } = runHighlighterWithAstro(language, code);

		return `<pre class="${classLanguage}"><code is:raw class="${classLanguage}">${html}</code></pre>`;
	});
};
