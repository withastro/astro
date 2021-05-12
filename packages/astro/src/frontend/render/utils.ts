import unified from 'unified';
import parse from 'rehype-parse';
import toH from 'hast-to-hyperscript';
import { ComponentRenderer } from '../../@types/renderer';
import shorthash from 'shorthash';
import moize from 'moize';

/** Reduces an array of objects to a single object */
export function toSingleObject(dependencies: Record<string, any>[]) {
  return dependencies.reduce((obj, item) => Object.assign(obj, item), {});
}

/** Filters non-unique values from an array */
export function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

/** Returns a deterministic hash of the HTML content */
export function getAstroId(html: string) {
  return shorthash.unique(html);
}

/** Wraps HTML content with unique Astro Id  */
export function wrapWithAstroId(html: string, id: string) {
  return `<div data-astro-id="${id}" style="display:contents">${html}</div>`
}

/** Removes indentation from a string */
export function dedent(str: string) {
	let arr = str.match(/^[ \t]*(?=\S)/gm);
	let min = !!arr && Math.min(...arr.map(x => x.length));
	return (!arr || !min) ? str : str.replace(new RegExp(`^[ \\t]{${min}}`, 'gm'), '');
}

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
  const vnodes = tree.map((subtree) => {
    if (subtree.type === 'text') return subtree.value;
    return toH(h, subtree);
  });
  return vnodes;
});

/**
 * Converts an HTML fragment string into h function calls as a string
 * @param h framework's `createElement` function
 * @param children the HTML string children
 */
export const childrenToJsx = moize.deep(function childrenToJsx(renderer: ComponentRenderer<any>, children: string[]): any {
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
    if (['string', 'number', 'boolean'].includes(typeof child)) return JSON.stringify(child);
    if (child === null) return `null`;
    if ((child as any).__SERIALIZED) return (child as any).__SERIALIZED;
    return innerH(child).__SERIALIZED;
  };
  return tree.map((subtree) => {
    if (subtree.type === 'text') return JSON.stringify(subtree.value);
    return toH(innerH, subtree).__SERIALIZED;
  });
});
