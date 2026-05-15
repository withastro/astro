import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import { highlightCodeBlocks } from './highlight.js';
const rehypePrism = (excludeLangs) => {
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
export { rehypePrism };
