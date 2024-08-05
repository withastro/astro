import type { Image, ImageReference } from 'mdast';
import { definitions } from 'mdast-util-definitions';
import { visit } from 'unist-util-visit';
import type { MarkdownVFile } from './types.js';

export function remarkCollectImages() {
	return function (tree: any, vfile: MarkdownVFile) {
		if (typeof vfile?.path !== 'string') return;

		const definition = definitions(tree);
		const imagePaths = new Set<string>();
		visit(tree, ['image', 'imageReference'], (node: Image | ImageReference) => {
			if (node.type === 'image') {
				if (shouldOptimizeImage(node.url)) imagePaths.add(decodeURI(node.url));
			}
			if (node.type === 'imageReference') {
				const imageDefinition = definition(node.identifier);
				if (imageDefinition) {
					if (shouldOptimizeImage(imageDefinition.url))
						imagePaths.add(decodeURI(imageDefinition.url));
				}
			}
		});

		vfile.data.imagePaths = imagePaths;
	};
}

function shouldOptimizeImage(src: string) {
	// Optimize anything that is NOT external or an absolute path to `public/`
	return !isValidUrl(src) && !src.startsWith('/');
}

function isValidUrl(str: string): boolean {
	try {
		new URL(str);
		return true;
	} catch {
		return false;
	}
}
