import sizeOf from 'image-size';
import { join as pathJoin } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';
import { pathToFileURL } from 'url';
import type { MarkdownVFile } from './types.js';

export function rehypeImages(imageService: any, assetsDir: URL | undefined) {
	return () =>
		function (tree: any, file: MarkdownVFile) {
			visit(tree, (node) => {
				if (!assetsDir) return;
				if (node.type !== 'element') return;
				if (node.tagName !== 'img') return;

				if (node.properties?.src) {
					if (file.dirname) {
						if (!isRelativePath(node.properties.src) && !isAliasedPath(node.properties.src)) return;

						let fileURL: URL;
						if (isAliasedPath(node.properties.src)) {
							fileURL = new URL(stripAliasPath(node.properties.src), assetsDir);
						} else {
							fileURL = pathToFileURL(pathJoin(file.dirname, node.properties.src));
						}

						const fileData = sizeOf(fileURLToPath(fileURL));
						fileURL.searchParams.append('origWidth', fileData.width!.toString());
						fileURL.searchParams.append('origHeight', fileData.height!.toString());
						fileURL.searchParams.append('origFormat', fileData.type!.toString());

						let options = {
							src: {
								src: fileURL,
								width: fileData.width,
								height: fileData.height,
								format: fileData.type,
							},
							alt: node.properties.alt,
						};

						const imageURL = imageService.getURL(options);
						node.properties = Object.assign(node.properties, {
							src: imageURL,
							...(imageService.getHTMLAttributes !== undefined
								? imageService.getHTMLAttributes(options)
								: {}),
						});
					}
				}
			});
		};
}

function isAliasedPath(path: string) {
	return path.startsWith('~/assets');
}

function stripAliasPath(path: string) {
	return path.replace('~/assets/', '');
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
