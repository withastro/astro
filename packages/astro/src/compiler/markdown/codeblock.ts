import { visit } from 'unist-util-visit';

/**  */
export function remarkCodeBlock() {
  const visitor = (node: any) => {
    const { data, lang, meta } = node;
    let currentClassName = data?.hProperties?.class ?? '';
    node.data = node.data || {};
    node.data.hProperties = node.data.hProperties || {};
    node.data.hProperties = { ...node.data.hProperties, class: `language-${lang} ${currentClassName}`.trim(), lang, meta }

    return node;
  };
  return () => (tree: any) => visit(tree, 'code', visitor);
}

/**  */
export function rehypeCodeBlock() {
  const escapeCode = (code: any) => {
    code.children = code.children.map((child: any) => {
      if (child.type === 'text') {
        return { ...child, value: child.value.replace(/\{/g, '&#123;') };
      }
      return child;
    })
  }
  const visitor = (node: any) => {
    if (node.tagName === 'code') {
      escapeCode(node);
      return;
    }

    if (node.tagName !== 'pre') return;
    const code = node.children[0];
    if (code.tagName !== 'code') return;
    node.properties = { ...code.properties };

    return node;
  };
  return () => (tree: any) => visit(tree, 'element', visitor);
}
