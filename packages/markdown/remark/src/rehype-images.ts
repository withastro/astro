import { visit } from 'unist-util-visit';
import type { MarkdownVFile } from './types.js';

export function rehypeImages() {
	return () =>
			function (tree: any, file: MarkdownVFile) {
					const imageOccurrenceMap = new Map();

					visit(tree, (node) => {
							if (node.type !== 'element') return;
							if (node.tagName !== 'img') return;

							if (node.properties?.src) {
									if (file.data.imagePaths?.has(node.properties.src)) {
											const { alt, ...otherProps } = node.properties;

											// Initialize or increment occurrence count for this image
											const currentCount = imageOccurrenceMap.get(node.properties.src) || 0;
											imageOccurrenceMap.set(node.properties.src, currentCount + 1);

											const index = { index: currentCount };
											console.log("creating __ASTRO_IMAGE__ img ", "with props:", otherProps, "at index:", index)
											node.properties['__ASTRO_IMAGE_'] = JSON.stringify({ ...otherProps, index });
											
											Object.keys(otherProps).forEach((prop) => {
													delete node.properties[prop];
											});
									}
							}
					});
			};
}
