import { visit } from 'unist-util-visit';
function rehypeMetaString() {
	return function (tree) {
		visit(tree, (node) => {
			if (node.type === 'element' && node.tagName === 'code' && node.data?.meta) {
				node.properties ??= {};
				node.properties.metastring = node.data.meta;
			}
		});
	};
}
export { rehypeMetaString as default };
