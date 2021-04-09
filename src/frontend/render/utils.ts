import unified from 'unified';
import parse from 'rehype-parse';
import toH from 'hast-to-hyperscript';
import toHTML from 'hast-util-to-html';
import { ComponentRenderer } from '../../@types/renderer';
import moize from 'moize';

/** @internal */
function childrenToTree(children: string[]) {
  return children.map((child) => (unified().use(parse, { fragment: true }).parse(child) as any).children.pop());
}

/**
 * Converts an HTML fragment string into vnodes for rendering via provided framework
 * @param h framework's `createElement` function
 * @param children the HTML string children
 */
export const childrenToVnodes = moize.deep(function childrenToVnodes(h: any, children: string[]) {
  const tree = childrenToTree(children);
  const vnodes = tree.map((subtree) => toH(h, subtree));
  return vnodes;
});

/**
 * Converts an HTML fragment string into h function calls as a string
 * @param h framework's `createElement` function
 * @param children the HTML string children
 */
export const childrenToH = moize.deep(function childrenToH(renderer: ComponentRenderer<any>, children: string[]): any {
  if (!renderer.jsxPragma) return;
  const tree = childrenToTree(children);
  const innerH = (name: any, attrs: Record<string, any> | null = null, _children: string[] | null = null) => {
    const vnode = renderer.jsxPragma?.(name, attrs, _children);
    const childStr = _children ? `, [${_children.map((child) => serializeChild(child)).join(',')}]` : '';
    /* fix(react): avoid hard-coding keys into the serialized tree */
    if (attrs && attrs.key) attrs.key = undefined;
    const __SERIALIZED = `${renderer.jsxPragmaName}("${name}", ${attrs ? JSON.stringify(attrs) : 'null'}${childStr})` as string;
    return { ...vnode, __SERIALIZED };
  };
  const serializeChild = (child: unknown) => {
    if (typeof child === 'string') return `\`${child}\``;
    if (typeof child === 'number' || typeof child === 'boolean') return `${child}`;
    if (child === null) return `null`;
    if ((child as any).__SERIALIZED) return (child as any).__SERIALIZED;
    return innerH(child).__SERIALIZED;
  };
  return tree.map((subtree) => toH(innerH, subtree).__SERIALIZED);
});

/**
 * Injects a [data-astro-id] attribute to the output
 * If the output renders a single top-level element, [data-astro-id] is added there
 * If the output renders a fragment, a wrapper element is used
 * @param rendered string
 * @param dataAstroId string
 */
export function injectAstroId(rendered: string, dataAstroId: string) {
    let tree = unified().use(parse, { fragment: true }).parse(rendered);

    tree = {
        ...tree,
        children: (tree.children as any).filter((child: any) => child.type !== 'comment').map((child: any) => {
            if (child.type === 'element') {
                child.properties = { ...child.properties, dataAstroId }; 
            }
            return child;
        })
    }
    
    return toHTML(tree);
}
