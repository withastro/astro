import type { AstroMarkdownOptions } from '../@types/astro';
import createCollectHeaders from './markdown/rehype-collect-headers.js';
import scopedStyles from './markdown/remark-scoped-styles.js';
import { remarkCodeBlock, rehypeCodeBlock } from './markdown/codeblock.js';
import raw from 'rehype-raw';

import unified from 'unified';
import markdown from 'remark-parse';
import markdownToHtml from 'remark-rehype';
// import smartypants from '@silvenon/remark-smartypants';
import rehypeStringify from 'rehype-stringify';

export interface MarkdownRenderingOptions extends Partial<AstroMarkdownOptions> {
  $?: {
    scopedClassName: string | null;
  };
  mode: 'md' | 'astro-md';
}

/** Internal utility for rendering a full markdown file and extracting Frontmatter data */
export async function renderMarkdownWithFrontmatter(contents: string, opts?: MarkdownRenderingOptions | null) {
  // Dynamic import to ensure that "gray-matter" isn't built by Snowpack
  const { default: matter } = await import('gray-matter');
  const { data: frontmatter, content } = matter(contents);
  const value = await renderMarkdown(content, { ...opts, mode: 'md' });
  return { ...value, frontmatter };
}

/** Shared utility for rendering markdown */
export async function renderMarkdown(content: string, opts?: MarkdownRenderingOptions | null) {
  const { $: { scopedClassName = null } = {}, mode = 'astro-md', footnotes: useFootnotes = true, gfm: useGfm = true } = opts ?? {};
  const { headers, rehypeCollectHeaders } = createCollectHeaders();

  let parser = unified().use(markdown).use(remarkCodeBlock());

  if (scopedClassName) {
    parser = parser.use(scopedStyles(scopedClassName));
  }

  if (useGfm) {
    const { default: gfm } = await import('remark-gfm');
    parser = parser.use(gfm);
  }

  if (useFootnotes) {
    const { default: footnotes } = await import('remark-footnotes');
    parser = parser.use(footnotes);
  }

  let result: string;
  try {
    const vfile = await parser
      .use(markdownToHtml, { allowDangerousHtml: true, passThrough: ['raw'] })
      .use(raw)
      .use(rehypeCollectHeaders)
      .use(rehypeCodeBlock())
      .use(rehypeStringify)
      .process(content);
    result = vfile.contents.toString();
  } catch (err) {
    throw err;
  }

  return {
    astro: { headers, source: content },
    content: result.toString(),
  };
}
