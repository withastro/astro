import type { ImageMetadata } from './types.js';
import { createComponent, render, spreadAttributes, unescapeHTML } from '../runtime/server/index.js';
import { normalizeProps, makeNonEnumerable } from './utils/svg.js';

export interface SvgComponentProps {
    meta: ImageMetadata;
    attributes: Record<string, string>;
    children: string;
}

// Make sure these IDs are kept on the module-level
// so they're incremented on a per-page basis
let ids = 0;
export function createSvgComponent({ meta, attributes, children }: SvgComponentProps) {
    const id = `a:${ids++}`;
    const rendered = new WeakSet<Response>();
    const Component = createComponent((result, props) => {
        const { viewBox, title: titleProp, ...normalizedProps } = normalizeProps(attributes, props);
        const title = titleProp ? unescapeHTML(`<title>${titleProp}</title>`) : '';
        let symbol: any = '';
        // On first render, include the symbol definition
        if (!rendered.has(result.response)) {
            // We only need the viewBox on the symbol, can drop it everywhere else
            symbol = unescapeHTML(`<symbol${spreadAttributes({ viewBox, id })}>${children}</symbol>`);
            rendered.add(result.response);
        }
        return render`<svg${spreadAttributes(normalizedProps)}>${title}${symbol}<use xlink:href="#${id}" /></svg>`;
    })
    makeNonEnumerable(Component);
    if (import.meta.env.DEV) {
        Object.defineProperty(Component, Symbol.for('nodejs.util.inspect.custom'), { value: (_: any, opts: any, inspect: any) => inspect(meta, opts) })
    }
    return Object.assign(Component, meta);
}

