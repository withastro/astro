import type { Image } from 'mdast';
import { visit } from 'unist-util-visit';
import type { MarkdownVFile } from './types';

export function remarkCollectImages() {
	return function (tree: any, vfile: MarkdownVFile) {
		if (typeof vfile?.path !== 'string') return;

		const imagePaths = new Set<string>();
		visit(tree, 'image', (node: Image) => {
			if (shouldOptimizeImage(node.url)) imagePaths.add(node.url);
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
