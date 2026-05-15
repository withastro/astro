import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { definitions } from 'mdast-util-definitions';
import { visit } from 'unist-util-visit';
function remarkCollectImages(opts) {
	const domains = opts?.domains ?? [];
	const remotePatterns = opts?.remotePatterns ?? [];
	return function (tree, vfile) {
		if (typeof vfile?.path !== 'string') return;
		const definition = definitions(tree);
		const localImagePaths = /* @__PURE__ */ new Set();
		const remoteImagePaths = /* @__PURE__ */ new Set();
		visit(tree, (node) => {
			let url;
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
				localImagePaths.add(url);
			}
		});
		vfile.data.astro ??= {};
		vfile.data.astro.localImagePaths = Array.from(localImagePaths);
		vfile.data.astro.remoteImagePaths = Array.from(remoteImagePaths);
	};
}
export { remarkCollectImages };
