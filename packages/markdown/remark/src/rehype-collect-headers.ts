import { visit } from 'unist-util-visit';
import type { Root, Properties } from 'hast';
import slugger from 'github-slugger';

/**  */
export default function createCollectHeaders() {
  const headers: any[] = [];

  function rehypeCollectHeaders() {
    return function (tree: Root) {
      visit(tree, (node) => {
        if (node.type !== 'element') return;
        const { tagName } = node;
        if (tagName[0] !== 'h') return;
        const [_, level] = tagName.match(/h([0-6])/) ?? [];
        if (!level) return;
        const depth = Number.parseInt(level);

        let text = '';

        visit(node, 'text', (child) => {
          text += child.value;
        });

        let slug = node?.properties?.id || slugger.slug(text);

        node.properties = node.properties || {};
        node.properties.id = slug;
        headers.push({ depth, slug, text });
      });
    };
  }

  return {
    headers,
    rehypeCollectHeaders,
  };
}
