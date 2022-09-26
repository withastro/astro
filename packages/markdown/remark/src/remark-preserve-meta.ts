import { visit } from 'unist-util-visit';

type MaybeString = string | null | undefined;

/**  */
function transformer(className: MaybeString) {
	return function (tree: any) {
		const visitor = (node: any) => {
			const { lang, value, meta } = node;
			node.type = "html";
			let preClasses = className?.length ? `class=${className}` : ''
			let metaAttribute = meta && meta.length > 0 ? `meta=${meta}` : ''
			node.value = `<pre ${preClasses}><code is:raw ${metaAttribute}>${value}</code></pre>`;
			return node;
		};
		return visit(tree, 'code', visitor);
	};
}

function plugin(className: MaybeString) {
	return transformer.bind(null, className);
}

export default plugin;
