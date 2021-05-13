import fromMarkdown from 'mdast-util-mdx/from-markdown.js';
import toMarkdown from 'mdast-util-mdx/to-markdown.js';

/** See https://github.com/micromark/micromark-extension-mdx-md */
const syntax = { disable: {null: ['autolink', 'codeIndented']} };

/** 
 * Lite version of https://github.com/mdx-js/mdx/tree/main/packages/remark-mdx
 * We don't need all the features MDX does because all components are precompiled
 * to HTML. We just want to disable a few MD features that cause issues.
 */
function mdxLite (this: any) {
  let data = this.data()

  add('micromarkExtensions', syntax);
  add('fromMarkdownExtensions', fromMarkdown)
  add('toMarkdownExtensions', toMarkdown)

  /** Adds remark plugin */
  function add(field: string, value: any) {
    if (data[field]) data[field].push(value)
    else data[field] = [value]
  }
}

export default mdxLite;
