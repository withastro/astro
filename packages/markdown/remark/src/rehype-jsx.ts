import { visit } from 'unist-util-visit';

const MDX_ELEMENTS = ['mdxJsxFlowElement', 'mdxJsxTextElement'];
export default function rehypeJsx(): any {
	return function (node: any): any {
		visit(node, 'element', (child: any) => {
			child.tagName = `${child.tagName}`;
		});
		visit(node, MDX_ELEMENTS, (child: any, index: number | null, parent: any) => {
			if (index === null || !Boolean(parent))
				return;
			
			const attrs = child.attributes.reduce((acc: any[], entry: any) => {
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

			if (child.children.length === 0) {
				child.type = 'raw';
				child.value = `<${child.name}${attrs} />`;
				return;
			}

			// Replace the current child node with its children
			// wrapped by raw opening and closing tags
			const openingTag = {
				type: 'raw',
				value: `\n<${child.name}${attrs}>`,
			};
			const closingTag = {
				type: 'raw',
				value: `</${child.name}>\n`,
			};
			parent.children.splice(index, 1, openingTag, ...child.children, closingTag);
		});
	};
}
