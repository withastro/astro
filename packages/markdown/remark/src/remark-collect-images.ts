import type { Image } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

type OptionalResolveImage = ((path: string) => Promise<string>) | undefined;

export default function toRemarkCollectImages(resolveImage: OptionalResolveImage) {
	return () =>
		async function (tree: any, vfile: VFile) {
			if (typeof vfile?.path !== 'string') return;

			const imagePaths = new Set<string>();
			visit(tree, 'image', function raiseError(node: Image) {
				imagePaths.add(node.url);
			});
			if (imagePaths.size === 0) {
				vfile.data.imagePaths = [];
				return;
			} else if (resolveImage) {
				const mapping = new Map<string, string>();
				for (const path of Array.from(imagePaths)) {
					const id = await resolveImage(path);
					mapping.set(path, id);
				}
				visit(tree, 'image', function raiseError(node: Image) {
					node.url = mapping.get(node.url)!;
				});
			}

			vfile.data.imagePaths = Array.from(imagePaths);
		};
}
