import syntaxMdxjs from 'micromark-extension-mdxjs';
import { fromMarkdown, toMarkdown } from 'mdast-util-mdx';

/**
 * Add the micromark and mdast extensions for MDX.js (JS aware MDX).
 *
 * @this {Processor}
 * @param {MdxOptions} [options]
 * @return {void}
 */
export function remarkMdx(this: any, options: any) {
  let data = this.data();

  add('micromarkExtensions', syntaxMdxjs(options));
  add('fromMarkdownExtensions', fromMarkdown);
  add('toMarkdownExtensions', toMarkdown);

  /**
   * @param {string} field
   * @param {unknown} value
   */
  function add(field: string, value: any) {
    // Other extensions defined before this.
    // Useful when externalizing.
    /* c8 ignore next 2 */
    // @ts-ignore Assume it’s an array.
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }
}
