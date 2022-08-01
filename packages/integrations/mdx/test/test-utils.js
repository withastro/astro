import { jsToTreeNode } from '@astrojs/mdx/utils';
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function rehypeReadingTime() {
  return function (tree) {
		const readingTime = getReadingTime(toString(tree))
		tree.children.unshift(
			jsToTreeNode(`export const readingTime = ${JSON.stringify(readingTime)}`)
		)
  };
}
