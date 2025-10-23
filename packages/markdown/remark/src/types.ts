import type { RemotePattern } from '@astrojs/internal-helpers/remote';
import type * as hast from 'hast';
import type * as mdast from 'mdast';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { BuiltinTheme } from 'shiki';
import type * as unified from 'unified';
import type { CreateShikiHighlighterOptions, ShikiHighlighterHighlightOptions } from './shiki.js';

export type { Node } from 'unist';

declare module 'vfile' {
	interface DataMap {
		astro: {
			headings?: MarkdownHeading[];
			localImagePaths?: string[];
			remoteImagePaths?: string[];
			frontmatter?: Record<string, any>;
		};
	}
}

export type RemarkPlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	mdast.Root
>;

export type RemarkPlugins = (string | [string, any] | RemarkPlugin | [RemarkPlugin, any])[];

export type RehypePlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	hast.Root
>;

export type RehypePlugins = (string | [string, any] | RehypePlugin | [RehypePlugin, any])[];

export type RemarkRehype = RemarkRehypeOptions;

export type ThemePresets = BuiltinTheme | 'css-variables';

export type SyntaxHighlightConfigType = 'shiki' | 'prism';

export interface SyntaxHighlightConfig {
	type: SyntaxHighlightConfigType;
	excludeLangs?: string[];
}

export interface ShikiConfig
	extends Pick<CreateShikiHighlighterOptions, 'langs' | 'theme' | 'themes' | 'langAlias'>,
		Pick<ShikiHighlighterHighlightOptions, 'defaultColor' | 'wrap' | 'transformers'> {}

/**
 * Configuration options that end up in the markdown section of AstroConfig
 */
export interface AstroMarkdownOptions {
	syntaxHighlight?: SyntaxHighlightConfig | SyntaxHighlightConfigType | false;
	shikiConfig?: ShikiConfig;
	remarkPlugins?: RemarkPlugins;
	rehypePlugins?: RehypePlugins;
	remarkRehype?: RemarkRehype;
	gfm?: boolean;
	smartypants?: boolean;
}

/**
 * Extra configuration options from other parts of AstroConfig that get injected into this plugin
 */
export interface AstroMarkdownProcessorOptions extends AstroMarkdownOptions {
	image?: {
		domains?: string[];
		remotePatterns?: RemotePattern[];
	};
	experimentalHeadingIdCompat?: boolean;
}

export interface MarkdownProcessor {
	render: (
		content: string,
		opts?: MarkdownProcessorRenderOptions,
	) => Promise<MarkdownProcessorRenderResult>;
}

export interface MarkdownProcessorRenderOptions {
	/** @internal */
	fileURL?: URL;
	/** Used for frontmatter injection plugins */
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

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}
