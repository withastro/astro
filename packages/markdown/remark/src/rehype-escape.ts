import { SKIP, visit } from 'unist-util-visit';

export default function rehypeEscape(): any {
	return function (node: any): any {
		return visit(node, 'element', (el) => {
			if (el.tagName === 'code' || el.tagName === 'pre') {
				el.properties['is:raw'] = true;
			}
			return el;
		});
	};
}
