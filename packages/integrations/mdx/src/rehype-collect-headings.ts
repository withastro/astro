import type { VFile } from 'vfile';
import { jsToTreeNode } from './utils.js';

// Escape unsafe characters for safe code injection
const charMap: Record<string, string> = {
	'<': '\\u003C',
	'>': '\\u003E',
	'/': '\\u002F',
	'\\': '\\\\',
	'\b': '\\b',
	'\f': '\\f',
	'\n': '\\n',
	'\r': '\\r',
	'\t': '\\t',
	'\0': '\\0',
	'\u2028': '\\u2028',
	'\u2029': '\\u2029'
};
function escapeUnsafeChars(str: string): string {
	return str.replace(/[<>\b\f\n\r\t\0\u2028\u2029/\\]/g, x => charMap[x] || x);
}

export function rehypeInjectHeadingsExport() {
	return function (tree: any, file: VFile) {
		const headings = file.data.astro?.headings ?? [];
		tree.children.unshift(
			jsToTreeNode(`export function getHeadings() { return ${escapeUnsafeChars(JSON.stringify(headings))} }`),
		);
	};
}
