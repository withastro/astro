import mdxLite from './markdown/remark-mdx-lite.js';
import createCollectHeaders from './markdown/rehype-collect-headers.js';
import scopedStyles from './markdown/remark-scoped-styles.js';

export interface MarkdownRenderingOptions {
  $?: {
    scopedClassName: string | null;
  };
  footnotes?: boolean;
  gfm?: boolean;
  plugins?: any[];
}

/** Shared utility for rendering markdown */
export async function renderMarkdown(contents: string, opts?: MarkdownRenderingOptions | null) {
  // No biggie because this function can be `async`,
  // but this is some weirdness happening with the `unified` ecosystem
  // or our build setup... these *should* be regular imports but they
  // only seem to work when using dynamic import like this?!
  const [unified, matter, markdown, markdownToHtml, smartypants, stringify, raw] = (await Promise.all([
    import('unified'),
    import('gray-matter'),
    import('remark-parse'),
    import('remark-rehype'),
    import('@silvenon/remark-smartypants'),
    import('rehype-stringify'),
    import('rehype-raw'),
  ])) as any[];
  const { $: { scopedClassName = null } = {}, footnotes: useFootnotes = true, gfm: useGfm = true, plugins = [] } = opts ?? {};
  const {
    data: { layout, ...frontmatterData },
    content,
  } = matter(contents);
  const { headers, rehypeCollectHeaders } = createCollectHeaders();

  let parser = unified().use(markdown).use(mdxLite).use(smartypants);

  if (scopedClassName) {
    parser = parser.use(scopedStyles(scopedClassName));
  }

  if (useGfm) {
    const gfm = await import('remark-gfm');
    parser = parser.use(gfm);
  }

  if (useFootnotes) {
    const footnotes = await import('remark-footnotes');
    parser = parser.use(footnotes);
  }

  let result: string;
  try {
    const vfile = await parser
      .use(markdownToHtml, { allowDangerousHtml: true })
      .use(raw)
      .use(rehypeCollectHeaders)
      .use(stringify)
      .process(contents);
    result = vfile.contents;
  } catch (err) {
    throw err;
  }

  return {
    frontmatter: frontmatterData,
    astro: { headers, source: content },
    content: result.toString(),
  };
}
