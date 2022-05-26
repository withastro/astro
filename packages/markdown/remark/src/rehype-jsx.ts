import { map } from 'unist-util-map';

const MDX_ELEMENTS = new Set(['mdxJsxFlowElement', 'mdxJsxTextElement']);
export default function rehypeJsx(): any {
	return function (node: any): any {
		return map(node, (child: any) => {
			if (child.type === 'element') {
				return { ...child, tagName: `${child.tagName}` };
			}
			if (MDX_ELEMENTS.has(child.type)) {
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
					return {
						type: 'raw',
						value: `<${child.name}${attrs} />`,
					};
				}
				child.children.splice(0, 0, {
					type: 'raw',
					value: `\n<${child.name}${attrs}>`,
				});
				child.children.push({
					type: 'raw',
					value: `</${child.name}>\n`,
				});
				return {
					...child,
					type: 'element',
					tagName: `Fragment`,
				};
			}
			return child;
		});
	};
}
