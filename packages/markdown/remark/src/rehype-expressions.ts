import { map } from 'unist-util-map';

export default function rehypeExpressions(): any {
	return function (node: any): any {
		return map(node, (child) => {
			if (child.type === 'text') {
				return { ...child, type: 'raw' };
			}
			if (child.type === 'mdxTextExpression') {
				return { type: 'raw', value: `{${(child as any).value}}` };
			}
			if (child.type === 'mdxFlowExpression') {
				return { type: 'raw', value: `{${(child as any).value}}` };
			}
			return child;
		});
	};
}
