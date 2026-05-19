export { defaultExcludeLanguages } from './highlight.js';
export {
	createCollectImagesPlugin as satteriCollectImagesPlugin,
	createHeadingIdsPlugin as satteriHeadingIdsPlugin,
	createImageMarkerPlugin as satteriImageMarkerPlugin,
	createShikiPlugin as satteriShikiPlugin,
	collectHastText as satteriCollectHastText,
	makeFragmentNode as satteriMakeFragmentNode,
	createSatteriMarkdownProcessor,
	type SatteriMarkdownProcessorOptions,
} from './satteri-processor.js';
export {
	isSatteriProcessor,
	satteri,
	type SatteriProcessorDescriptor,
	type SatteriProcessorOptions,
} from './processor.js';
export { satteriMarkdownDefaults, syntaxHighlightDefaults } from './defaults.js';
export {
	clearShikiHighlighterCache,
	createShikiHighlighter,
	type CreateShikiHighlighterOptions,
	type ShikiHighlighter,
	type ShikiHighlighterHighlightOptions,
	type ThemePresets,
} from './shiki.js';
export type {
	AstroMarkdownProcessorOptions,
	MarkdownHeading,
	MarkdownProcessor,
	MarkdownProcessorRenderOptions,
	MarkdownProcessorRenderResult,
	ShikiConfig,
	Smartypants,
	SyntaxHighlightConfig,
	SyntaxHighlightConfigType,
} from './types.js';
