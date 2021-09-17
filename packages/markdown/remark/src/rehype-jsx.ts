import { map } from 'unist-util-map';

const MDX_ELEMENTS = new Set(['mdxJsxFlowElement', 'mdxJsxTextElement']);
export default function rehypeJsx(): any {
  return function (node: any): any {
    return map(node, (child) => {
      if (child.type === 'element') {
        return { ...child, tagName: `${child.tagName}` }
      }
      if (MDX_ELEMENTS.has(child.type)) {
        return { 
          ...child,
          type: 'element',
          tagName: `${child.name}`,
          properties: child.attributes.reduce((acc, entry) => {
            let attr = entry.value;
            if (attr && typeof attr === 'object') {
              attr = `{${attr.value}}`
            }
            return Object.assign(acc, { [entry.name]: attr });
          }, {})
        };
      }
      return child;
    });
  };
}
