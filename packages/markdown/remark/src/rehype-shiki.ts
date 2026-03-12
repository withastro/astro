import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { highlightCodeBlocks } from './highlight.js';
import { createShikiHighlighter, type ShikiHighlighter } from './shiki.js';
import type { ShikiConfig } from './types.js';

export const rehypeShiki: Plugin<[ShikiConfig, string[]?], Root> = (config, excludeLangs) => {
	let highlighterAsync: Promise<ShikiHighlighter> | undefined;

	return async (tree) => {
		highlighterAsync ??= createShikiHighlighter({
			langs: config?.langs,
			theme: config?.theme,
			themes: config?.themes,
			langAlias: config?.langAlias,
		});
		const highlighter = await highlighterAsync;

		await highlightCodeBlocks(
			tree,
			(code, language, options) => {
				return highlighter.codeToHast(code, language, {
					meta: options?.meta,
					wrap: config?.wrap,
					defaultColor: config?.defaultColor,
					transformers: config?.transformers,
				});
			},
			excludeLangs,
		);
	};
};
