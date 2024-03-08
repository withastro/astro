import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { createShikiHighlighter, type ShikiHighlighter } from './shiki.js';
import type { ShikiConfig } from './types.js';
import { highlightCodeBlocks } from './highlight.js';

export const rehypeShiki: Plugin<[ShikiConfig?], Root> = (config) => {
	let highlighterAsync: Promise<ShikiHighlighter> | undefined;

	return async (tree) => {
		highlighterAsync ??= createShikiHighlighter(config);
		const highlighter = await highlighterAsync;

		highlightCodeBlocks(tree, highlighter.highlight);
	};
};
