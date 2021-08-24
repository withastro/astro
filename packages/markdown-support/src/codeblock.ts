import { visit } from 'unist-util-visit';
import type { Node } from 'unist';
import type { Element } from 'hast';
import type { Code } from 'mdast';

/**  */
export function remarkCodeBlock() {
  return function (tree: Node) {
    visit(tree, 'code', (node: Code) => {
      const { data, meta } = node;
      let lang = node.lang || 'html'; // default to html matches GFM behavior.

      let currentClassName = (data?.hProperties as { [k: string]: string })?.class ?? '';
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties = { ...(node.data.hProperties as { [k: string]: string }), class: `language-${lang} ${currentClassName}`.trim(), lang, meta };
    });
  };
}

/**  */
export function rehypeCodeBlock() {
  return function (tree: Node) {
    const escapeCode = (code: Element): void => {
      code.children = code.children.map((child) => {
        if (child.type === 'text') {
          return { ...child, value: child.value.replace(/\{/g, 'ASTRO_ESCAPED_LEFT_CURLY_BRACKET\0') };
        }
        return child;
      });
    };
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'code') {
        escapeCode(node);
        return;
      }

      if (node.tagName !== 'pre') return;
      const code = node.children[0] as Element;
      if (code.tagName !== 'code') return;
      node.properties = { ...code.properties };
    });
  };
}
