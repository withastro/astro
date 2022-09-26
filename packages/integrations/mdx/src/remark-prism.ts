import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import { visit } from 'unist-util-visit';

/**  */
export default function remarkPrism() {
	return (tree: any) =>
		visit(tree, 'code', (node: any) => {
			let { lang, value, meta } = node;
			node.type = 'html';

			let { html, classLanguage } = runHighlighterWithAstro(lang, value);
			let classes = [classLanguage];
			let metaAttribute = meta && meta.length > 0 ? `meta=${meta}` : ''
			node.value = `<pre class="${classes.join(
				' '
			)}"><code class="${classLanguage}" ${metaAttribute}>${html}</code></pre>`;
			return node;
		});
}
