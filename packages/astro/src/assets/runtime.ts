import {
	createComponent,
	render,
	spreadAttributes,
	unescapeHTML,
} from '../runtime/server/index.js';
import type { ImageMetadata } from './types.js';
import { makeNonEnumerable, normalizeProps } from './utils/svg.js';

export interface SvgComponentProps {
	meta: ImageMetadata;
	attributes: Record<string, string>;
	children: string;
}

/**
 * Make sure these IDs are kept on the module-level so they're incremented on a per-page basis
 */
let ids = 0;
export function createSvgComponent({ meta, attributes, children }: SvgComponentProps) {
	const id = `a:${ids++}`;
	const rendered = new WeakSet<Response>();
	const Component = createComponent((result, props) => {
		const { title: titleProp, viewBox, mode, ...normalizedProps } = normalizeProps(attributes, props);
		const title = titleProp ? unescapeHTML(`<title>${titleProp}</title>`) : '';

		if (mode === 'sprite') {
			// On the first render, include the symbol definition
			let symbol: any = '';
			if (!rendered.has(result.response)) {
				// We only need the viewBox on the symbol definition, we can drop it everywhere else
				symbol = unescapeHTML(`<symbol${spreadAttributes({ viewBox, id })}>${children}</symbol>`);
				rendered.add(result.response);
			}

			return render`<svg${spreadAttributes(normalizedProps)}>${title}${symbol}<use xlink:href="#${id}" /></svg>`;
		}

		// Default to inline mode
		return render`<svg${spreadAttributes({viewBox, ...normalizedProps})}>${title}${unescapeHTML(children)}</svg>`
	});

	makeNonEnumerable(Component);

	if (import.meta.env.DEV) {
		// Maintaining the current `console.log` output for SVG imports
		Object.defineProperty(Component, Symbol.for('nodejs.util.inspect.custom'), {
			value: (_: any, opts: any, inspect: any) => inspect(meta, opts),
		});
	}

	// Attaching the metadata to the component to maintain current functionality
	return Object.assign(Component, meta);
}
