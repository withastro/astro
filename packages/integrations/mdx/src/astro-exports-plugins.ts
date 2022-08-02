import type { VFile } from 'vfile';
import type { MdxjsEsm } from 'mdast-util-mdx';
import { safelyGetAstroExports } from 'astro/vite-plugin-utils';
import { jsToTreeNode } from './utils.js';

export function remarkInitializeAstroExports() {
	return function (tree: any, vfile: VFile) {
		if (!vfile.data.astroExports) {
			vfile.data.astroExports = {};
		}
	};
}

export function rehypeApplyFrontmatterExport(pageFrontmatter: object, exportName = 'frontmatter') {
	return function (tree: any, vfile: VFile) {
		let frontmatter = pageFrontmatter;
		if (vfile.data.astroExports) {
			Object.assign(frontmatter, safelyGetAstroExports(vfile.data));
		}
		let exportNodes: MdxjsEsm[] = [];
		if (!exportName) {
			exportNodes = Object.entries(frontmatter).map(([k, v]) =>
				jsToTreeNode(`export const ${k} = ${JSON.stringify(v)};`)
			);
		} else {
			exportNodes = [jsToTreeNode(`export const ${exportName} = ${JSON.stringify(frontmatter)};`)];
		}
		tree.children = exportNodes.concat(tree.children);
	};
}
