import * as unified from 'unified';

export type UnifiedPluginImport = Promise<{ default: unified.Plugin }>;
export type Plugin = string | [string, any] | UnifiedPluginImport | [UnifiedPluginImport, any];

export interface AstroMarkdownOptions {
  /** Enable or disable footnotes syntax extension */
  footnotes: boolean;
  /** Enable or disable GitHub-flavored Markdown syntax extension */
  gfm: boolean;
  remarkPlugins: Plugin[];
  rehypePlugins: Plugin[];
}

export interface MarkdownRenderingOptions extends Partial<AstroMarkdownOptions> {
  /** @internal */
  $?: {
    scopedClassName: string | null;
  };
}
