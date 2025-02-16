import type { Root } from 'mdast';
import { definitions } from 'mdast-util-definitions';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

interface Opts {
	allowedRemoteDomains?: string[];
}

export function remarkCollectImages(opts?: Opts) {
	const allowedRemoteDomains = new Set(opts?.allowedRemoteDomains ?? []);

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

			try {
				const domain = new URL(url).host;
				if (allowedRemoteDomains.has(domain)) remoteImagePaths.add(url);
			} catch {
				// Not a valid remote URL. Check if it's a local image. If it's an absolute path, then it's not.
				if (!url.startsWith('/')) localImagePaths.add(url);
			}
		});

		vfile.data.astro ??= {};
		vfile.data.astro.localImagePaths = Array.from(localImagePaths);
		vfile.data.astro.remoteImagePaths = Array.from(remoteImagePaths);
	};
}
