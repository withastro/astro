import { highlightCodeBlocks } from './highlight.js';
import { createShikiHighlighter } from './shiki.js';
const rehypeShiki = (config, excludeLangs) => {
	let highlighterAsync;
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
export { rehypeShiki };
