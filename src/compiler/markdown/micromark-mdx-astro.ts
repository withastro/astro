import type { MicromarkExtension } from '../../@types/micromark';
import mdxExpression from 'micromark-extension-mdx-expression';
import mdxJsx from 'micromark-extension-mdx-jsx';


/**
 * Keep MDX.
 */
export function encodeAstroMdx() {
  const extension: MicromarkExtension = {
    enter: {
      mdxJsxFlowTag(node: any) {
        const mdx = this.sliceSerialize(node);
        this.raw(mdx);
      }
    }
  };

  return {
    htmlAstro: [mdxExpression(), mdxJsx()],
    mdAstro: extension
  };
}