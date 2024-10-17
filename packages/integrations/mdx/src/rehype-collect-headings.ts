import type { MarkdownHeading, MarkdownVFile } from '@astrojs/markdown-remark';
import { jsToTreeNode } from './utils.js';

export function rehypeInjectHeadingsExport() {
	return function (tree: any, file: MarkdownVFile) {
		const headings: MarkdownHeading[] = file.data.__astroHeadings || [];
		tree.children.unshift(
			jsToTreeNode(`export function getHeadings() { return ${JSON.stringify(headings)} }`),
		);
	};
}
