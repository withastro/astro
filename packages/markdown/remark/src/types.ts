import type * as unified from 'unified';
import type * as shiki from 'shiki';

export type UnifiedPluginImport = Promise<{ default: unified.Plugin }>;
export type Plugin = string | [string, any] | UnifiedPluginImport | [UnifiedPluginImport, any];

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
