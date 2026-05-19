import { defaultExcludeLanguages } from './highlight.js';
import type { ShikiConfig, SyntaxHighlightConfig } from './types.js';

export const syntaxHighlightDefaults: Required<SyntaxHighlightConfig> = {
	type: 'shiki',
	excludeLangs: defaultExcludeLanguages,
};

const shikiConfigDefaults: ShikiConfig = {
	langs: [],
	theme: 'github-dark',
	themes: {},
	wrap: false,
	transformers: [],
	langAlias: {},
};

export const satteriMarkdownDefaults = {
	syntaxHighlight: syntaxHighlightDefaults,
	shikiConfig: shikiConfigDefaults,
	gfm: true,
	smartypants: true,
};
