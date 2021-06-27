import unified from "unified";

export interface AstroMarkdownOptions {
  /** Enable or disable footnotes syntax extension */
  footnotes: boolean;
  /** Enable or disable GitHub-flavored Markdown syntax extension */
  gfm: boolean;
  remarkPlugins: any[]
}


export interface MarkdownRenderingOptions extends Partial<AstroMarkdownOptions> {
  $?: {
    scopedClassName: string | null;
  };
}
