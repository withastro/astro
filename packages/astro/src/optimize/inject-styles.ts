import { visit } from 'unist-util-visit';

const createStyleSheetLink = (href: string) => ({
  type: 'element',
  tagName: 'link',
  properties: {
    href,
    rel: ['stylesheet']
  },
  children: []
})

const visitor = (css: string[]) => (node: any) => {
  const { tagName } = node;
  if (tagName === 'head') {
    node.children = [
      ...(node.children || []),
      ...css.map(href => createStyleSheetLink(href))
    ]
  }
  return node;
};

export default ({ css }: { css: string[] }) => (tree: any) => {
  if (Array.isArray(css) && css.length === 0) return;

  visit(tree, 'element', visitor(css));
}
