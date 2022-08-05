import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import { jsToTreeNode } from '../dist/utils.js';

export function rehypeReadingTime() {
	return function (tree, { data }) {
		const readingTime = getReadingTime(toString(tree));
		tree.children.unshift(
			jsToTreeNode(`export const readingTime = ${JSON.stringify(readingTime)}`)
		);
		data.astro.frontmatter.injectedReadingTime = readingTime;
	};
}
