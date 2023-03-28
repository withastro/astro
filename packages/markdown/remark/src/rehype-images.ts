import { visit } from 'unist-util-visit';
import type { MarkdownVFile } from './types.js';

export function rehypeImages() {
	return () =>
		function (tree: any, file: MarkdownVFile) {
			visit(tree, (node) => {
				if (node.type !== 'element') return;
				if (node.tagName !== 'img') return;

				if (node.properties?.src) {
					if (file.dirname) {
						if (!isRelativePath(node.properties.src) && !isAliasedPath(node.properties.src)) return;

						node.properties['__ASTRO_IMAGE_'] = node.properties.src;
						delete node.properties.src;
					}
				}
			});
		};
}

function isAliasedPath(path: string) {
	return path.startsWith('~/assets');
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
