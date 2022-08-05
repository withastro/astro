import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
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

export function remarkTitle() {
	return function (tree, { data }) {
		visit(tree, ['heading'], (node) => {
			if (node.depth === 1) {
				data.astro.frontmatter.title = toString(node.children);
			}
		});
	};
}
