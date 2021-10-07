// Vite bug: dynamically import() modules needed for CJS. Cache in memory to keep side effects
import { mdxJsx } from 'micromark-extension-mdx-jsx';
import { mdxJsxFromMarkdown, mdxJsxToMarkdown } from 'mdast-util-mdx-jsx';

export function remarkJsx(this: any, options: any) {
  let settings = options || {};
  let data = this.data();

  add('micromarkExtensions', mdxJsx({}));
  add('fromMarkdownExtensions', mdxJsxFromMarkdown);
  add('toMarkdownExtensions', mdxJsxToMarkdown);

  function add(field: any, value: any) {
    /* istanbul ignore if - other extensions. */
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }
}
