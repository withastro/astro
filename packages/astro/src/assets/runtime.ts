import {
	createComponent,
	render,
	spreadAttributes,
	unescapeHTML,
} from '../runtime/server/index.js';
import type { ImageMetadata } from './types.js';

export interface SvgComponentProps {
	meta: ImageMetadata;
	attributes: Record<string, string>;
	children: string;
}

export function createSvgComponent({ meta, attributes, children }: SvgComponentProps) {
	const Component = createComponent((_, props) => {
		const normalizedProps = normalizeProps(attributes, props);

		return render`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
	});

	if (import.meta.env.DEV) {
		// Prevent revealing that this is a component
		makeNonEnumerable(Component);

		// Maintaining the current `console.log` output for SVG imports
		Object.defineProperty(Component, Symbol.for('nodejs.util.inspect.custom'), {
			value: (_: any, opts: any, inspect: any) => inspect(meta, opts),
		});
	}

	Object.defineProperty(Component, 'toJSON', {
		value: () => meta,
		enumerable: false,
	});

	// Attaching the metadata to the component to maintain current functionality
	return Object.assign(Component, meta);
}

type SvgAttributes = Record<string, any>;

/**
 * Some attributes required for `image/svg+xml` are irrelevant when inlined in a `text/html` document. We can save a few bytes by dropping them.
 */
const ATTRS_TO_DROP = ['xmlns', 'xmlns:xlink', 'version'];
const DEFAULT_ATTRS: SvgAttributes = {};

export function dropAttributes(attributes: SvgAttributes) {
	for (const attr of ATTRS_TO_DROP) {
		delete attributes[attr];
	}

	return attributes;
}

function normalizeProps(attributes: SvgAttributes, props: SvgAttributes) {
	return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

function makeNonEnumerable(object: Record<string, any>) {
	for (const property in object) {
		Object.defineProperty(object, property, { enumerable: false });
	}
}
