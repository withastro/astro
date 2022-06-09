import type { RehypePlugin } from './types.js';
import { visit } from 'unist-util-visit';

const MDX_ELEMENTS = ['mdxJsxFlowElement', 'mdxJsxTextElement'];

export default function rehypeJsx(): ReturnType<RehypePlugin> {
	return function (tree) {
		visit(tree, MDX_ELEMENTS, (node: any, index: number | null, parent: any) => {
			if (index === null || !Boolean(parent)) return;

			const attrs = node.attributes.reduce((acc: any[], entry: any) => {
				let attr = entry.value;
				if (attr && typeof attr === 'object') {
					attr = `{${attr.value}}`;
				} else if (attr && entry.type === 'mdxJsxExpressionAttribute') {
					attr = `{${attr}}`;
				} else if (attr === null) {
					attr = '';
				} else if (typeof attr === 'string') {
					attr = `"${attr}"`;
				}
				if (!entry.name) {
					return acc + ` ${attr}`;
				}
				return acc + ` ${entry.name}${attr ? '=' : ''}${attr}`;
			}, '');

			if (node.children.length === 0) {
				node.type = 'raw';
				node.value = `<${node.name}${attrs} />`;
				return;
			}

			// If the current node is a JSX <a> element, remove autolinks from its children
			// to prevent Markdown code like `<a href="/">**Go to www.example.com now!**</a>`
			// from creating a nested link to `www.example.com`
			if (node.name === 'a') {
				visit(node, 'element', (el, elIndex, elParent) => {
					const isAutolink = (
						el.tagName === 'a' &&
						el.children.length === 1 &&
						el.children[0].type === 'text' &&
						el.children[0].value.match(/^(https?:\/\/|www\.)/i)
					);

					// If we found an autolink, remove it by replacing it with its text-only child
					if (isAutolink) {
						elParent.children.splice(elIndex, 1, el.children[0]);
					}
				});
			}

			// Replace the current node with its children
			// wrapped by raw opening and closing tags
			const openingTag = {
				type: 'raw',
				value: `\n<${node.name}${attrs}>`,
			};
			const closingTag = {
				type: 'raw',
				value: `</${node.name}>\n`,
			};
			parent.children.splice(index, 1, openingTag, ...node.children, closingTag);
		});
	};
}
