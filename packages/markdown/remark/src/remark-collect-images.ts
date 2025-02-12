import type { Root } from 'mdast';
import { definitions } from 'mdast-util-definitions';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

export function remarkCollectImages() {
	return function (tree: Root, vfile: VFile) {
		if (typeof vfile?.path !== 'string') return;

		const definition = definitions(tree);
		const localImagePaths = new Set<string>();
		const remoteImagePaths = new Set<string>();
		visit(tree, (node) => {
			let url: string | undefined;
			if (node.type === 'image') {
				url = decodeURI(node.url);
			} else if (node.type === 'imageReference') {
				const imageDefinition = definition(node.identifier);
				if (imageDefinition) {
					url = decodeURI(imageDefinition.url);
				}
			}

			if (!url) return;
			else if (isValidUrl(url)) remoteImagePaths.add(url);	
			// Only optimize local images, not paths to `/public`
			else if (!url.startsWith("/")) localImagePaths.add(url);
		});

		vfile.data.astro ??= {};
		vfile.data.astro.localImagePaths = Array.from(localImagePaths);
		vfile.data.astro.remoteImagePaths = Array.from(remoteImagePaths);
	};
}

function isValidUrl(str: string): boolean {
	try {
		new URL(str);
		return true;
	} catch {
		return false;
	}
}
