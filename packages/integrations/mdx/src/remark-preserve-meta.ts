import { visit } from 'unist-util-visit';

/**  */
export default function remarkPreserveMeta() {
	return (tree: any) =>
		visit(tree, 'code', (node: any) => {
			let { lang, value, meta } = node;
			node.type = 'html';
			let codeClasses = lang && lang.length > 0 ? `class=language-${lang}` : ''
			let metaAttribute = meta && meta.length > 0 ? `meta=${meta}` : ''
			node.value = `<pre><code ${codeClasses} ${metaAttribute}>${value}</code></pre>`;
			return node;
		});
}
