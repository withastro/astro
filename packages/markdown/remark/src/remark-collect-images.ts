import type { Image } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

export default function toRemarkCollectImages() {
	return () =>
		function (tree: any, vfile: VFile) {
			if (typeof vfile?.path !== 'string') return;

			const imagePaths = new Set<string>();
			visit(tree, 'image', function raiseError(node: Image) {
				imagePaths.add(node.url);
			});
			if (imagePaths.size === 0) {
				vfile.data.imagePaths = [];
				return;
			}

			vfile.data.imagePaths = Array.from(imagePaths);
		};
}
