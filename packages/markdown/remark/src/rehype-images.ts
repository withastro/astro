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
						node.properties['__ASTRO_IMAGE_'] = node.properties.src;
						delete node.properties.src;
					}
				}
			});
		};
}
