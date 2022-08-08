import { SKIP, visit } from 'unist-util-visit';

export function escapeEntities(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function rehypeEscape(): any {
	return function (node: any): any {
		return visit(node, 'element', (el) => {
			if (el.tagName === 'code' || el.tagName === 'pre') {
				el.properties['is:raw'] = true;
				// Visit all raw children and escape HTML tags to prevent Markdown code
				// like "This is a `<script>` tag" from actually opening a script tag
				visit(el, 'raw', (raw) => {
					raw.value = escapeEntities(raw.value);
				});
				// Do not visit children to prevent double escaping
				return SKIP;
			}
		});
	};
}
