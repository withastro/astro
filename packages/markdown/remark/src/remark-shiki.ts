import { visit } from 'unist-util-visit';
import { type ShikiHighlighter, createShikiHighlighter } from './shiki.js';
import type { RemarkPlugin, ShikiConfig } from './types.js';

/**
 * @deprecated Use `rehypeShiki` instead
 */
export function remarkShiki(config?: ShikiConfig): ReturnType<RemarkPlugin> {
	let highlighterAsync: Promise<ShikiHighlighter> | undefined;

	return async (tree: any) => {
		highlighterAsync ??= createShikiHighlighter(config);
		const highlighter = await highlighterAsync;

		visit(tree, 'code', (node) => {
			const lang = typeof node.lang === 'string' ? node.lang : 'plaintext';
			const html = highlighter.highlight(node.value, lang);

			node.type = 'html';
			node.value = html;
			node.children = [];
		});
	};
}
