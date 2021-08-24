import { visit } from 'unist-util-visit';
import type { Node } from 'unist';
import type { Element } from 'hast';
import slugger from 'github-slugger';

/**  */
export default function createCollectHeaders() {
  const headers: any[] = [];

  function rehypeCollectHeaders() {
    return function (tree: Node) {
      visit(tree, (node: Node) => {
        if (node.type !== 'element') return;
        const { tagName, children } = node as Element;
        if (tagName[0] !== 'h') return;
        const [_, level] = tagName.match(/h([0-6])/) ?? [];
        if (!level) return;
        const depth = Number.parseInt(level);

        let text = '';

        visit(node, 'text', (child) => {
          text += (child as any).value;
        });

        let slug = node?.data?.id || (slugger.slug(text) as string);

        node.data = node.data || {};
        node.data.properties = node.data.properties || {};
        node.data.properties = { ...(node.data.properties as { [k: string]: string }), slug };
        headers.push({ depth, slug, text });
      });
    };
  }

  return {
    headers,
    rehypeCollectHeaders,
  };
}
