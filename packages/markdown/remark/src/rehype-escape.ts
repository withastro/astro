import { SKIP, visit } from 'unist-util-visit';

export default function rehypeEscape(): any {
	return function (node: any): any {
		return visit(node, 'element', (el) => {
			if (el.tagName === 'code' || el.tagName === 'pre') {
				el.properties['is:raw'] = true;
				// Visit all raw children and escape HTML tags to prevent Markdown code
				// like "This is a `<script>` tag" from actually opening a script tag
				visit(el, 'raw', (raw) => {
					raw.value = raw.value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				});
			}
			return el;
		});
	};
}
