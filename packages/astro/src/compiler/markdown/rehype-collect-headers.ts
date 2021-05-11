import visit from 'unist-util-visit';
import slugger from 'github-slugger';

/**  */
export default function createCollectHeaders() {
  const headers: any[] = [];

  const visitor = (node: any) => {
    if (node.type !== 'element') return;
    const { tagName, children } = node
    if (tagName[0] !== 'h') return;
    let [_, depth] = tagName.match(/h([0-6])/) ?? [];
    if (!depth) return;
    depth = Number.parseInt(depth);
    
    let text = '';
    if (children.length === 1 && children[0].type === 'text') {
      text = children[0].value;
    }

    let slug = slugger.slug(text);
    node.properties = node.properties || {};
    node.properties.id = slug;
    headers.push({ depth, slug, text });

    return node;
  }

  return { headers, rehypeCollectHeaders: () => (tree: any) => visit(tree, visitor) }
}
