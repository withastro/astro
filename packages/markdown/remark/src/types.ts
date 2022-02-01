import type * as unified from 'unified';
import type { ShikiConfig } from './remark-shiki';

export type UnifiedPluginImport = Promise<{ default: unified.Plugin }>;
export type Plugin = string | [string, any] | UnifiedPluginImport | [UnifiedPluginImport, any];

export interface AstroMarkdownOptions {
	mode?: 'md' | 'mdx';
	syntaxHighlight?: 'prism' | 'shiki' | false;
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
