import { generateCspDigest } from '../core/encryption.js';
import {
	createComponent,
	render,
	spreadAttributes,
	unescapeHTML,
} from '../runtime/server/index.js';
function createSvgComponent({ meta, attributes, children, styles }) {
	const hasStyles = styles.length > 0;
	const Component = createComponent({
		async factory(result, props) {
			const normalizedProps = normalizeProps(attributes, props);
			if (hasStyles && result.cspDestination) {
				for (const style of styles) {
					const hash = await generateCspDigest(style, result.cspAlgorithm);
					result._metadata.extraStyleHashes.push(hash);
				}
			}
			return render`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
		},
		propagation: hasStyles ? 'self' : 'none',
	});
	if (import.meta.env.DEV) {
		makeNonEnumerable(Component);
		Object.defineProperty(Component, /* @__PURE__ */ Symbol.for('nodejs.util.inspect.custom'), {
			value: (_, opts, inspect) => inspect(meta, opts),
		});
	}
	Object.defineProperty(Component, 'toJSON', {
		value: () => meta,
		enumerable: false,
	});
	return Object.assign(Component, meta);
}
const ATTRS_TO_DROP = ['xmlns', 'xmlns:xlink', 'version'];
const DEFAULT_ATTRS = {};
function dropAttributes(attributes) {
	for (const attr of ATTRS_TO_DROP) {
		delete attributes[attr];
	}
	return attributes;
}
function normalizeProps(attributes, props) {
	return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}
function makeNonEnumerable(object) {
	for (const property in object) {
		Object.defineProperty(object, property, { enumerable: false });
	}
}
export { createSvgComponent, dropAttributes };
