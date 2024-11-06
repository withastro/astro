import {
	createComponent,
	render,
	spreadAttributes,
	unescapeHTML,
} from '../runtime/server/index.js';
import type { SSRResult } from '../types/public/index.js';
import type { ImageMetadata } from './types.js';

export interface SvgComponentProps {
	meta: ImageMetadata;
	attributes: Record<string, string>;
	children: string;
}

/**
 * Make sure these IDs are kept on the module-level so they're incremented on a per-page basis
 */
// let ids = 0;

const ids = new WeakMap<SSRResult, number>();
let counter = 0;

export function createSvgComponent({ meta, attributes, children }: SvgComponentProps) {
	const rendered = new WeakSet<Response>();
	const Component = createComponent((result, props) => {
		let id;
		if (ids.has(result)) {
			id = ids.get(result)!;
		} else {
			counter += 1;
			ids.set(result, counter);
			id = counter;
		}
		const {
			title: titleProp,
			viewBox,
			mode,
			...normalizedProps
		} = normalizeProps(attributes, props);
		const title = titleProp ? unescapeHTML(`<title>${titleProp}</title>`) : '';

		if (mode === 'sprite') {
			// On the first render, include the symbol definition
			let symbol: any = '';
			if (!rendered.has(result.response)) {
				// We only need the viewBox on the symbol definition, we can drop it everywhere else
				symbol = unescapeHTML(`<symbol${spreadAttributes({ viewBox, id })}>${children}</symbol>`);
				rendered.add(result.response);
			}

			return render`<svg${spreadAttributes(normalizedProps)}>${title}${symbol}<use href="#${id}" /></svg>`;
		}

		// Default to inline mode
		return render`<svg${spreadAttributes({ viewBox, ...normalizedProps })}>${title}${unescapeHTML(children)}</svg>`;
	});

	if (import.meta.env.DEV) {
		// Prevent revealing that this is a component
		makeNonEnumerable(Component);

		// Maintaining the current `console.log` output for SVG imports
		Object.defineProperty(Component, Symbol.for('nodejs.util.inspect.custom'), {
			value: (_: any, opts: any, inspect: any) => inspect(meta, opts),
		});
	}

	// Attaching the metadata to the component to maintain current functionality
	return Object.assign(Component, meta);
}

type SvgAttributes = Record<string, any>;

/**
 * Some attributes required for `image/svg+xml` are irrelevant when inlined in a `text/html` document. We can save a few bytes by dropping them.
 */
const ATTRS_TO_DROP = ['xmlns', 'xmlns:xlink', 'version'];
const DEFAULT_ATTRS: SvgAttributes = { role: 'img' };

export function dropAttributes(attributes: SvgAttributes) {
	for (const attr of ATTRS_TO_DROP) {
		delete attributes[attr];
	}

	return attributes;
}

function normalizeProps(attributes: SvgAttributes, { size, ...props }: SvgAttributes) {
	if (size !== undefined && props.width === undefined && props.height === undefined) {
		props.height = size;
		props.width = size;
	}

	return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

function makeNonEnumerable(object: Record<string, any>) {
	for (const property in object) {
		Object.defineProperty(object, property, { enumerable: false });
	}
}
