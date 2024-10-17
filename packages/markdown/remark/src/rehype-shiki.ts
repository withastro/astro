import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { highlightCodeBlocks } from './highlight.js';
import { type ShikiHighlighter, createShikiHighlighter } from './shiki.js';
import type { ShikiConfig } from './types.js';

export const rehypeShiki: Plugin<[ShikiConfig?], Root> = (config) => {
	let highlighterAsync: Promise<ShikiHighlighter> | undefined;

	return async (tree) => {
		highlighterAsync ??= createShikiHighlighter(config);
		const highlighter = await highlighterAsync;

		await highlightCodeBlocks(tree, highlighter.highlight);
	};
};
