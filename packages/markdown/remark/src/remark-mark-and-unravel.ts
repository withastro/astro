//  https://github.com/mdx-js/mdx/blob/main/packages/mdx/lib/plugin/remark-mark-and-unravel.js
/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Content} Content
 * @typedef {Root|Content} Node
 * @typedef {Extract<Node, import('unist').Parent>} Parent
 *
 * @typedef {import('remark-mdx')} DoNotTouchAsThisImportItIncludesMdxInTree
 */

import { visit } from 'unist-util-visit';

/**
 * A tiny plugin that unravels `<p><h1>x</h1></p>` but also
 * `<p><Component /></p>` (so it has no knowledge of “HTML”).
 * It also marks JSX as being explicitly JSX, so when a user passes a `h1`
 * component, it is used for `# heading` but not for `<h1>heading</h1>`.
 *
 * @type {import('unified').Plugin<Array<void>, Root>}
 */
export default function remarkMarkAndUnravel() {
	return (tree: any) => {
		visit(tree, (node, index, parent_) => {
			const parent = /** @type {Parent} */ parent_;
			let offset = -1;
			let all = true;
			/** @type {boolean|undefined} */
			let oneOrMore;

			if (parent && typeof index === 'number' && node.type === 'paragraph') {
				const children = node.children;

				while (++offset < children.length) {
					const child = children[offset];

					if (child.type === 'mdxJsxTextElement' || child.type === 'mdxTextExpression') {
						oneOrMore = true;
					} else if (child.type === 'text' && /^[\t\r\n ]+$/.test(String(child.value))) {
						// Empty.
					} else {
						all = false;
						break;
					}
				}

				if (all && oneOrMore) {
					offset = -1;

					while (++offset < children.length) {
						const child = children[offset];

						if (child.type === 'mdxJsxTextElement') {
							child.type = 'mdxJsxFlowElement';
						}

						if (child.type === 'mdxTextExpression') {
							child.type = 'mdxFlowExpression';
						}
					}

					parent.children.splice(index, 1, ...children);
					return index;
				}
			}

			if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
				const data = node.data || (node.data = {});
				data._mdxExplicitJsx = true;
			}
		});
	};
}
