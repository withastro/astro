import type { AstroMarkdownOptions, MarkdownRenderingOptions } from './types';

import createCollectHeaders from './rehype-collect-headers.js';
import scopedStyles from './remark-scoped-styles.js';
import remarkExpressions from './remark-expressions.js';
import rehypeExpressions from './rehype-expressions.js';
import { rehypeCodeBlock } from './codeblock.js';
import { loadPlugins } from './load-plugins.js';
import raw from 'rehype-raw';

import unified from 'unified';
import markdown from 'remark-parse';
import markdownToHtml from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export { AstroMarkdownOptions, MarkdownRenderingOptions };

/** Internal utility for rendering a full markdown file and extracting Frontmatter data */
export async function renderMarkdownWithFrontmatter(contents: string, opts?: MarkdownRenderingOptions | null) {
  // Dynamic import to ensure that "gray-matter" isn't built by Snowpack
  const { default: matter } = await import('gray-matter');
  const { data: frontmatter, content } = matter(contents);
  const value = await renderMarkdown(content, opts);
  return { ...value, frontmatter };
}

/** Shared utility for rendering markdown */
export async function renderMarkdown(content: string, opts?: MarkdownRenderingOptions | null) {
  const { $: { scopedClassName = null } = {}, footnotes: useFootnotes = true, gfm: useGfm = true, remarkPlugins = [], rehypePlugins = [] } = opts ?? {};
  const { headers, rehypeCollectHeaders } = createCollectHeaders();
  let parser = unified().use(markdown).use([remarkExpressions, { addResult: true }]);

  if (remarkPlugins.length === 0) {
    if (useGfm) {
      remarkPlugins.push('remark-gfm');
    }

    if (useFootnotes) {
      remarkPlugins.push('remark-footnotes');
    }

    remarkPlugins.push('@silvenon/remark-smartypants');
  }
  const loadedRemarkPlugins = await Promise.all(loadPlugins(remarkPlugins));
  const loadedRehypePlugins = await Promise.all(loadPlugins(rehypePlugins));

  loadedRemarkPlugins.forEach(([plugin, opts]) => {
    parser.use(plugin, opts);
  });

  if (scopedClassName) {
    parser.use(scopedStyles(scopedClassName));
  }

  parser.use(markdownToHtml, { allowDangerousHtml: true, passThrough: ['raw', 'mdxTextExpression'] });
  parser.use(rehypeExpressions);

  loadedRehypePlugins.forEach(([plugin, opts]) => {
    parser.use(plugin, opts);
  });

  let result: string;
  try {
    const vfile = await parser.use(raw).use(rehypeCollectHeaders).use(rehypeCodeBlock()).use(rehypeStringify, { entities: { useNamedReferences: true }}).process(content);
    result = vfile.contents.toString();
  } catch (err) {
    throw err;
  }

  return {
    astro: { headers, source: content, html: result.toString() },
    content: result.toString(),
  };
}
