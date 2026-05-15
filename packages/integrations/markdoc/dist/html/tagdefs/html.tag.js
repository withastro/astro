import Markdoc from '@markdoc/markdoc';
const booleanAttributes = /* @__PURE__ */ new Set([
	'allowfullscreen',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'disablepictureinpicture',
	'disableremoteplayback',
	'download',
	'formnovalidate',
	'hidden',
	'inert',
	'ismap',
	'itemscope',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'selected',
]);
import { parseInlineCSSToReactLikeObject } from '../css/parse-inline-css-to-react.js';
const htmlTag = {
	attributes: {
		name: { type: String, required: true },
		attrs: { type: Object },
	},
	transform(node, config) {
		const { name, attrs: unsafeAttributes } = node.attributes;
		const children = node.transformChildren(config);
		const { style, ...safeAttributes } = unsafeAttributes;
		for (const [key, value] of Object.entries(safeAttributes)) {
			if (booleanAttributes.has(key)) {
				safeAttributes[key] = value === '' || value === true || value === 'true';
			}
		}
		if (typeof style === 'string') {
			const styleObject = parseInlineCSSToReactLikeObject(style);
			safeAttributes.style = styleObject;
		}
		return new Markdoc.Tag(name, safeAttributes, children);
	},
};
export { htmlTag };
