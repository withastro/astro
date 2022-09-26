import { runHighlighterWithAstro } from '@astrojs/prism/dist/highlighter';
import { visit } from 'unist-util-visit';
const noVisit = new Set(['root', 'html', 'text']);

type MaybeString = string | null | undefined;

/**  */
function transformer(className: MaybeString) {
	return function (tree: any) {
		const visitor = (node: any) => {
			let { lang, value, meta } = node;
			node.type = 'html';

			let { html, classLanguage } = runHighlighterWithAstro(lang, value);
			let classes = [classLanguage];
			if (className) {
				classes.push(className);
			}
			let metaAttribute = meta && meta.length > 0 ? `meta=${meta}` : ''
			node.value = `<pre class="${classes.join(
				' '
			)}"><code is:raw class="${classLanguage}" ${metaAttribute}>${html}</code></pre>`;
			return node;
		};
		return visit(tree, 'code', visitor);
	};
}

function plugin(className: MaybeString) {
	return transformer.bind(null, className);
}

export default plugin;
