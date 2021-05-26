import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

const visitScripts = (scripts: Set<Node>) => (node: any, i: any, parent: any) => {
  const { tagName } = node;
  if (tagName === 'script' && node.properties.dataAstroHydrate === '') {
    scripts.add(node);
    parent.children = parent.children.filter((n: any) => n !== node);
  }
  return node;
};

const moveScripts = (scripts: Set<Node>) => (node: any) => {
  const { tagName } = node;
  if (tagName === 'head') {
    node.children = [...(node.children ?? []), ...scripts];
  }
  return node;
};

export default () => (tree: any) => {
  const scripts = new Set<Node>();
  visit(tree, 'element', visitScripts(scripts));
  return visit(tree, 'element', moveScripts(scripts));
}
