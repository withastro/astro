import { map } from 'unist-util-map';

export default function rehypeExpressions(): any {
	return function (node: any): any {
		return map(node, (child) => {
			if (child.type === 'mdxTextExpression') {
				return { type: 'text', value: `{${(child as any).value}}` };
			}
			return child;
		});
	};
}
