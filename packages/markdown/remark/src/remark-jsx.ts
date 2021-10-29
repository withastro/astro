// Vite bug: dynamically import() modules needed for CJS. Cache in memory to keep side effects
let mdxJsx: any;
let mdxJsxFromMarkdown: any;
let mdxJsxToMarkdown: any;

export function remarkJsx(this: any, options: any) {
  let settings = options || {};
  let data = this.data();

  // TODO this seems to break adding slugs, no idea why add('micromarkExtensions', mdxJsx({}));
  add('fromMarkdownExtensions', mdxJsxFromMarkdown);
  add('toMarkdownExtensions', mdxJsxToMarkdown);

  function add(field: any, value: any) {
    /* istanbul ignore if - other extensions. */
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }
}

export async function loadRemarkJsx() {
  if (!mdxJsx) {
    const micromarkMdxJsx = await import('micromark-extension-mdx-jsx');
    mdxJsx = micromarkMdxJsx.mdxJsx;
  }
  if (!mdxJsxFromMarkdown || !mdxJsxToMarkdown) {
    const mdastUtilMdxJsx = await import('mdast-util-mdx-jsx');
    mdxJsxFromMarkdown = mdastUtilMdxJsx.mdxJsxFromMarkdown;
    mdxJsxToMarkdown = mdastUtilMdxJsx.mdxJsxToMarkdown;
  }
}
