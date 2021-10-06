import { visit } from 'unist-util-visit';
import type { Element, Root as HastRoot, Properties } from 'hast';
import type { Root as MdastRoot } from 'mdast';

/**  */
export function remarkCodeBlock() {
  return function (tree: MdastRoot) {
    visit(tree, 'code', (node) => {
      const { data, meta } = node;
      let lang = node.lang || 'html'; // default to html to match GFM behavior.

      let currentClassName = (data?.hProperties as Properties)?.class ?? '';
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties = { ...(node.data.hProperties as Properties), class: `language-${lang} ${currentClassName}`.trim(), lang, meta };
    });
  };
}

/**  */
export function rehypeCodeBlock() {
  return function (tree: HastRoot) {
    const escapeCode = (code: Element): void => {
      code.children = code.children.map((child) => {
        if (child.type === 'text') {
          return { ...child, value: child.value.replace(/\{/g, 'ASTRO_ESCAPED_LEFT_CURLY_BRACKET\0') };
        }
        return child;
      });
    };
    visit(tree, 'element', (node) => {
      if (node.tagName === 'code') {
        escapeCode(node);
        return;
      }

      if (node.tagName !== 'pre') return;
      if (!node.children[0]) return;
      const code = node.children[0];
      if (code.type !== 'element' || code.tagName !== 'code') return;
      node.properties = { ...code.properties };
    });
  };
}
