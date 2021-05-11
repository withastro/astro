import visit from 'unist-util-visit';

/**  */
export default function raw() {
  const visitor = (node: any) => {
    if (node.type !== 'raw') return;
    // console.log(node.type)
    // node.type = 'text';
    console.log(node);
    return node;
  }
  return (tree: any) => visit(tree, visitor);
}
