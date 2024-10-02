import { parse, renderSync } from 'ultrahtml';
import type { ImageMetadata } from '../types.js';
import type { SvgComponentProps } from '../runtime.js';
type SvgAttributes = Record<string, any>;

/**
 * Some attributes required for `image/svg+xml` are irrelevant when inlined ina `text/html` document. We can save a few bytes by dropping them.
 */
const ATTRS_TO_DROP = ['xmlns', 'xmlns:xlink', 'version'];
const DEFAULT_ATTRS: SvgAttributes = { role: 'img' };

function dropAttributes(attributes: SvgAttributes) {
	for (const attr of ATTRS_TO_DROP) {
		delete attributes[attr];
	}

	return attributes;
}

export function normalizeProps(attributes: SvgAttributes, { size, ...props }: SvgAttributes) {
	if (size !== undefined && props.width === undefined && props.height === undefined) {
		props.height = size;
		props.width = size;
	}

	return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

export function makeNonEnumerable(object: Record<string, any>) {
	for (const property in object) {
		Object.defineProperty(object, property, { enumerable: false });
	}
}

function parseSvg(contents: string) {
	const root = parse(contents);
	const [{ attributes, children }] = root.children;
	const body = renderSync({ ...root, children });

	return { attributes, body };
}

export function makeSvgComponent(meta: ImageMetadata, contents: Buffer | string) {
	const file = typeof contents === 'string' ? contents : contents.toString('utf-8');
	const { attributes, body: children } = parseSvg(file);
	const props: SvgComponentProps = {
		meta,
		attributes: dropAttributes(attributes),
		children,
	};

	return `import { createSvgComponent } from 'astro/assets/runtime';
export default createSvgComponent(${JSON.stringify(props)})`;
}
