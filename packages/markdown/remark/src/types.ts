import type * as unified from 'unified';
import type { ShikiConfig } from './remark-shiki';

export type Plugin = string | [string, any] | unified.Plugin | [unified.Plugin, any];

export interface AstroMarkdownOptions {
	mode?: 'md' | 'mdx';
	syntaxHighlight?: 'shiki' | 'prism' | false;
	shikiConfig?: ShikiConfig;
	remarkPlugins?: Plugin[];
	rehypePlugins?: Plugin[];
}

export interface MarkdownRenderingOptions extends Partial<AstroMarkdownOptions> {
	/** @internal */
	$?: {
		scopedClassName: string | null;
	};
}
