import type { Properties, Root } from 'hast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

export function rehypeImages() {
	return function (tree: Root, file: VFile) {
		if (!file.data.astro?.localImagePaths?.length && !file.data.astro?.remoteImagePaths?.length) {
			// No images to transform, nothing to do.
			return;
		}

		const imageOccurrenceMap = new Map();

		visit(tree, 'element', (node) => {
			if (node.tagName !== 'img') return;
			if (typeof node.properties?.src !== 'string') return;

			const src = decodeURI(node.properties.src);
			let newProperties: Properties;

			if (file.data.astro?.localImagePaths?.includes(src)) {
				// Override the original `src` with the new, decoded `src` that Astro will better understand.
				newProperties = { ...node.properties, src };
			} else if (file.data.astro?.remoteImagePaths?.includes(src)) {
				newProperties = {
					// By default, markdown images won't have width and height set. However, just in case another user plugin does set these, we should respect them.
					inferSize: 'width' in node.properties && 'height' in node.properties ? undefined : true,
					...node.properties,
					src,
				};
			} else {
				// Not in localImagePaths or remoteImagePaths, we should not transform.
				return;
			}

			// Initialize or increment occurrence count for this image
			const index = imageOccurrenceMap.get(node.properties.src) || 0;
			imageOccurrenceMap.set(node.properties.src, index + 1);

			// Set a special property on the image so later Astro code knows to process this image.
			node.properties = { __ASTRO_IMAGE_: JSON.stringify({ ...newProperties, index }) };
		});
	};
}
