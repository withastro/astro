import { visit } from 'unist-util-visit';
import type { MarkdownVFile } from './types.js';

export function rehypeImages() {
	return () =>
		function (tree: any, file: MarkdownVFile) {
			visit(tree, (node) => {
				if (node.type !== 'element') return;
				if (node.tagName !== 'img') return;

				if (node.properties?.src) {
					if (file.data.imagePaths?.has(node.properties.src)) {
						const { alt, ...otherProps } = node.properties;
						node.properties['__ASTRO_IMAGE_'] = JSON.stringify({ ...otherProps });
						Object.keys(otherProps).forEach((prop) => {
							delete node.properties[prop];
						});
					}
				}
			});
		};
}
