import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import { visit } from 'unist-util-visit';
import type { RemarkPlugin } from './types.js';

export function remarkPrism(): ReturnType<RemarkPlugin> {
	return function (tree: any) {
		visit(tree, 'code', (node) => {
			let { lang, value } = node;
			node.type = 'html';

			let { html, classLanguage } = runHighlighterWithAstro(lang, value);
			let classes = [classLanguage];
			node.value = `<pre class="${classes.join(
				' '
			)}"><code is:raw class="${classLanguage}">${html}</code></pre>`;
			return node;
		});
	};
}
