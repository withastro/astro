// Vite bug: dynamically import() modules needed for CJS. Cache in memory to keep side effects
import { mdxExpression } from 'micromark-extension-mdx-expression';
import { mdxExpressionFromMarkdown, mdxExpressionToMarkdown } from 'mdast-util-mdx-expression';

export function remarkExpressions(this: any, options: any) {
  let settings = options || {};
  let data = this.data();

  add('micromarkExtensions', mdxExpression({}));
  add('fromMarkdownExtensions', mdxExpressionFromMarkdown);
  add('toMarkdownExtensions', mdxExpressionToMarkdown);

  function add(field: any, value: any) {
    /* istanbul ignore if - other extensions. */
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }
}
