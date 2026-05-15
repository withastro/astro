import type {
	AstroMarkdownOptions,
	AstroMarkdownProcessorOptions,
	MarkdownProcessor,
	SyntaxHighlightConfig,
} from './types.js';
export {
	extractFrontmatter,
	isFrontmatterValid,
	type ParseFrontmatterOptions,
	type ParseFrontmatterResult,
	parseFrontmatter,
} from './frontmatter.js';
export { rehypeHeadingIds } from './rehype-collect-headings.js';
export { rehypePrism } from './rehype-prism.js';
export { rehypeShiki } from './rehype-shiki.js';
export { remarkCollectImages } from './remark-collect-images.js';
export {
	type CreateShikiHighlighterOptions,
	createShikiHighlighter,
	type ShikiHighlighter,
	type ShikiHighlighterHighlightOptions,
} from './shiki.js';
export * from './types.js';
export declare const syntaxHighlightDefaults: Required<SyntaxHighlightConfig>;
export declare const markdownConfigDefaults: Required<AstroMarkdownOptions>;
/**
 * Create a markdown preprocessor to render multiple markdown files
 */
export declare function createMarkdownProcessor(
	opts?: AstroMarkdownProcessorOptions,
): Promise<MarkdownProcessor>;
