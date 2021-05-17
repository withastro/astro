import { visit } from 'unist-util-visit';
const noVisit = new Set(['root', 'html', 'text']);

/**  */
export default function scopedStyles(className: string) {
  const visitor = (node: any) => {
    if (noVisit.has(node.type)) return;

    const { data } = node;
    const currentClassName = data?.hProperties?.class ?? '';
    node.data = node.data || {};
    node.data.hProperties = node.data.hProperties || {};
    node.data.hProperties.className = `${className} ${currentClassName}`.trim();

    return node;
  };
  return () => (tree: any) => visit(tree, visitor);
}
