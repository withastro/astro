import { visit } from 'unist-util-visit';
import type { MarkdownVFile } from './types.js';

export function rehypeRelativeImages(imageService: any) {
	return () =>
		function (tree: any, file: MarkdownVFile) {
			visit(tree, (node) => {
				if (node.type !== 'element') return;
				if (node.tagName !== 'img') return;

				if (node.properties?.src) {
					if (isRelativePath(node.properties.src.toString())) {
						node.properties.$injectURL = node.properties.src;

						if (!node.properties.width) {
							node.properties.$injectWidth = true;
						}

						if (!node.properties.height) {
							node.properties.$injectHeight = true;
						}
					}
				}
			});
		};
}

function isRelativePath(path: string) {
	return startsWithDotDotSlash(path) || startsWithDotSlash(path);
}

function startsWithDotDotSlash(path: string) {
	const c1 = path[0];
	const c2 = path[1];
	const c3 = path[2];
	return c1 === '.' && c2 === '.' && c3 === '/';
}

function startsWithDotSlash(path: string) {
	const c1 = path[0];
	const c2 = path[1];
	return c1 === '.' && c2 === '/';
}
