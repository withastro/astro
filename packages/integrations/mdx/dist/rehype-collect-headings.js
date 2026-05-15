import { jsToTreeNode } from './utils.js';
function rehypeInjectHeadingsExport() {
	return function (tree, file) {
		const headings = file.data.astro?.headings ?? [];
		tree.children.unshift(
			jsToTreeNode(`export function getHeadings() { return ${JSON.stringify(headings)} }`),
		);
	};
}
export { rehypeInjectHeadingsExport };
