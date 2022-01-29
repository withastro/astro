import shiki from 'shiki';
import { visit } from 'unist-util-visit';

const remarkShiki = async (theme: shiki.Theme) => {
	const highlighter = await shiki.getHighlighter({ theme });

	return () => (tree: any) => {
		visit(tree, 'code', (node) => {
			let html = highlighter.codeToHtml(node.value, { lang: node.lang ?? 'plaintext' });

			// Replace "shiki" class naming with "astro".
			html = html.replace('<pre class="shiki"', '<pre class="astro-code"');
			// Replace "shiki" css variable naming with "astro".
			html = html.replace(/style="(background-)?color: var\(--shiki-/g, 'style="$1color: var(--astro-code-');

			node.type = 'html';
			node.value = html;
			node.children = [];
		});
	};
};

export default remarkShiki;
