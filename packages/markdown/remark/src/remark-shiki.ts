import shiki from 'shiki';
import { visit } from 'unist-util-visit';

const remarkShiki = async (theme: shiki.Theme) => {
	const highlighter = await shiki.getHighlighter({ theme });

	return () => (tree: any) => {
		visit(tree, 'code', (node) => {
			const highlighted = highlighter.codeToHtml(node.value, { lang: node.lang ?? undefined });

			node.type = 'html';
			node.value = highlighted;
			node.children = [];
		});
	};
};

export default remarkShiki;
