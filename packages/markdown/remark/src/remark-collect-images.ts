import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { Root } from 'mdast';
import { definitions } from 'mdast-util-definitions';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import type { AstroMarkdownProcessorOptions } from './types.js';

export function remarkCollectImages(opts: AstroMarkdownProcessorOptions['image']) {
	const domains = opts?.domains ?? [];
	const remotePatterns = opts?.remotePatterns ?? [];

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

			if (URL.canParse(url)) {
				if (isRemoteAllowed(url, { domains, remotePatterns })) {
					remoteImagePaths.add(url);
				}
			} else if (!url.startsWith('/')) {
				// If:
				// + not a valid URL
				// + AND not an absolute path
				// Then it's a local image.
				localImagePaths.add(url);
			}
		});

		vfile.data.astro ??= {};
		vfile.data.astro.localImagePaths = Array.from(localImagePaths);
		vfile.data.astro.remoteImagePaths = Array.from(remoteImagePaths);
	};
}
