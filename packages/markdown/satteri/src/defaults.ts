import { defaultExcludeLanguages } from './highlight.js';
import type { ShikiConfig, SyntaxHighlightConfig } from '@astrojs/internal-helpers/markdown';

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
