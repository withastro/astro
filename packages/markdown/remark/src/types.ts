import type * as unified from 'unified';
import type * as shiki from 'shiki';

export type Plugin = string | [string, any] | unified.Plugin | [unified.Plugin, any];

export interface AstroMarkdownOptions {
	mode?: 'md' | 'mdx';
	syntaxHighlight?: 'prism' | 'shiki' | false;
	shikiTheme?: shiki.Theme;
	remarkPlugins?: Plugin[];
	rehypePlugins?: Plugin[];
}

export interface MarkdownRenderingOptions extends Partial<AstroMarkdownOptions> {
	/** @internal */
	$?: {
		scopedClassName: string | null;
	};
}
