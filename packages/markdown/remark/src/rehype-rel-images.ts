import sizeOf from 'image-size';
import { visit } from 'unist-util-visit';
import { pathToFileURL } from 'url';
import type { MarkdownVFile } from './types.js';
import path from 'node:path';

export function rehypeRelativeImages(imageService: any) {
	return () =>
		function (tree: any, file: MarkdownVFile) {
			visit(tree, (node) => {
				if (node.type !== 'element') return;
				if (node.tagName !== 'img') return;

				if (node.properties?.src) {
					if (isRelativePath(node.properties.src.toString())) {
						if (file.dirname) {
							const filePath = path.join(file.dirname, node.properties.src);
							const fileData = sizeOf(filePath);

							const fileURL = pathToFileURL(filePath);

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
