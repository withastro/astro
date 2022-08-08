import type { Literal } from 'unist';
import { visit } from 'unist-util-visit';

// In code blocks, this removes the JS comment wrapper added to
// HTML comments by vite-plugin-markdown-legacy.
export default function remarkEscape() {
	return (tree: any) => {
		visit(tree, 'code', removeCommentWrapper);
		visit(tree, 'inlineCode', removeCommentWrapper);
	};

	function removeCommentWrapper(node: Literal<string>) {
		node.value = node.value.replace(/{\/\*<!--/gs, '<!--').replace(/-->\*\/}/gs, '-->');
	}
}
