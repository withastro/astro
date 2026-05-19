import type { RemotePattern } from '@astrojs/internal-helpers/remote';
import type { Options as SmartypantsOptions } from 'retext-smartypants';
import type { CreateShikiHighlighterOptions, ShikiHighlighterHighlightOptions } from './shiki.js';

export type SyntaxHighlightConfigType = 'shiki' | 'prism';

export interface SyntaxHighlightConfig {
	type: SyntaxHighlightConfigType;
	excludeLangs?: string[];
}

export interface ShikiConfig
	extends Pick<CreateShikiHighlighterOptions, 'langs' | 'theme' | 'themes' | 'langAlias'>,
		Pick<ShikiHighlighterHighlightOptions, 'defaultColor' | 'wrap' | 'transformers'> {}

export type Smartypants = SmartypantsOptions;

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}

export interface AstroMarkdownProcessorOptions {
	syntaxHighlight?: SyntaxHighlightConfig | SyntaxHighlightConfigType | false;
	shikiConfig?: ShikiConfig;
	gfm?: boolean;
	smartypants?: boolean | SmartypantsOptions;
	image?: {
		domains?: string[];
		remotePatterns?: RemotePattern[];
	};
}

export interface MarkdownProcessor {
	render: (
		content: string,
		opts?: MarkdownProcessorRenderOptions,
	) => Promise<MarkdownProcessorRenderResult>;
}

export interface MarkdownProcessorRenderOptions {
	fileURL?: URL;
	frontmatter?: Record<string, any>;
}

export interface MarkdownProcessorRenderResult {
	code: string;
	metadata: {
		headings: MarkdownHeading[];
		localImagePaths: string[];
		remoteImagePaths: string[];
		frontmatter: Record<string, any>;
	};
}
