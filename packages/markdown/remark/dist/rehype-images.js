import { visit } from 'unist-util-visit';
const HAST_PRESERVED_PROPERTIES = [
	// HAST: className -> HTML: class
	'className',
	// HAST: htmlFor -> HTML: for
	'htmlFor',
];
function rehypeImages() {
	return function (tree, file) {
		if (!file.data.astro?.localImagePaths?.length && !file.data.astro?.remoteImagePaths?.length) {
			return;
		}
		const imageOccurrenceMap = /* @__PURE__ */ new Map();
		visit(tree, 'element', (node) => {
			if (node.tagName !== 'img') return;
			if (typeof node.properties?.src !== 'string') return;
			const src = decodeURI(node.properties.src);
			let imageProperties;
			if (file.data.astro?.localImagePaths?.includes(src)) {
				imageProperties = { ...node.properties, src };
			} else if (file.data.astro?.remoteImagePaths?.includes(src)) {
				imageProperties = {
					// By default, markdown images won't have width and height set. However, just in case another user plugin does set these, we should respect them.
					inferSize: 'width' in node.properties && 'height' in node.properties ? void 0 : true,
					...node.properties,
					src,
				};
			} else {
				return;
			}
			const hastProperties = {};
			for (const key of HAST_PRESERVED_PROPERTIES) {
				if (key in imageProperties) {
					hastProperties[key] = imageProperties[key];
					delete imageProperties[key];
				}
			}
			const index = imageOccurrenceMap.get(node.properties.src) || 0;
			imageOccurrenceMap.set(node.properties.src, index + 1);
			node.properties = {
				...hastProperties,
				__ASTRO_IMAGE_: JSON.stringify({ ...imageProperties, index }),
			};
		});
	};
}
export { rehypeImages };
