import unified from 'unified';

export interface AstroMarkdownOptions {
  /** Enable or disable footnotes syntax extension */
  footnotes: boolean;
  /** Enable or disable GitHub-flavored Markdown syntax extension */
  gfm: boolean;
  remarkPlugins: Promise<{ default: unified.Plugin }>[];
  rehypePlugins: Promise<{ default: unified.Plugin }>[];
}

export interface MarkdownRenderingOptions extends Partial<AstroMarkdownOptions> {
  $?: {
    scopedClassName: string | null;
  };
}
