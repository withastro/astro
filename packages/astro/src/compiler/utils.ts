import unified from 'unified';
import markdown from 'remark-parse';
import markdownToHtml from 'remark-rehype';
import gfm from 'remark-gfm';
import footnotes from 'remark-footnotes';
import stringify from 'rehype-stringify';
import smartypants from '@silvenon/remark-smartypants';

import mdxLite from './markdown/remark-mdx-lite.js';
import createCollectHeaders from './markdown/rehype-collect-headers.js';
import scopedStyles from './markdown/remark-scoped-styles.js';
import raw from 'rehype-raw';
import matter from 'gray-matter';

export interface MarkdownRenderingOptions {
  $?: {
    scopedClassName: string|null
  };
  footnotes?: boolean;
  gfm?: boolean;
  plugins: any[];
}

/** Shared utility for rendering markdown */
export function renderMarkdown(contents: string, opts?: MarkdownRenderingOptions|null) {
  const { $: { scopedClassName = null } = {}, footnotes: useFootnotes = true, gfm: useGfm = true, plugins = [] } = opts ?? {};
  const { data: { layout, ...frontmatterData }, content } = matter(contents);
  const { headers, rehypeCollectHeaders } = createCollectHeaders();

  let parser = unified()
    .use(markdown)
    .use(mdxLite)
    .use(smartypants);

  if (scopedClassName) {
    parser = parser.use(scopedStyles(scopedClassName));
  }

  if (useGfm) {
    parser = parser.use(gfm);
  }

  if (useFootnotes) {
    parser = parser.use(footnotes);
  }

  const { contents: result } = parser
    .use(markdownToHtml, { allowDangerousHtml: true })
    .use(raw)
    .use(rehypeCollectHeaders)
    .use(stringify)
    .processSync(contents)

  return {
    frontmatter: frontmatterData,
    astro: { headers, source: content },
    content: result
  };
}
