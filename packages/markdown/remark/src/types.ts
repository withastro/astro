import * as unified from 'unified';

export type UnifiedPluginImport = Promise<{ default: unified.Plugin }>;
export type Plugin = string | [string, any] | UnifiedPluginImport | [UnifiedPluginImport, any];

export interface AstroMarkdownOptions {
  mode?: 'md'|'mdx';
  remarkPlugins?: Plugin[];
  rehypePlugins?: Plugin[];
}

export interface MarkdownRenderingOptions extends Partial<AstroMarkdownOptions> {
  /** @internal */
  $?: {
    scopedClassName: string | null;
  };
}
