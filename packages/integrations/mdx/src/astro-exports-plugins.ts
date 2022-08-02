import type { VFile } from 'vfile';
import { safelyGetAstroExports } from 'astro/vite-plugin-utils';
import { jsToTreeNode } from './utils.js';

export function initializeAstroExportsPlugin() {
	return function (tree: any, vfile: VFile) {
		if (!vfile.data.astroExports) {
			vfile.data.astroExports = {};
		}
	};
}

export function applyAstroExportsPlugin() {
	return function (tree: any, vfile: VFile) {
		if (vfile.data.astroExports) {
			const astroExports = safelyGetAstroExports(vfile.data);
			const exportNodes = Object.entries(astroExports).map(([k, v]) =>
				jsToTreeNode(`export const ${k} = ${JSON.stringify(v)};`)
			);
			tree.children = exportNodes.concat(tree.children);
		}
	};
}
