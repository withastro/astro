import type { VFile } from 'vfile';
import type { MdxjsEsm } from 'mdast-util-mdx';
import { safelyGetAstroData } from 'astro/vite-plugin-utils';
import { jsToTreeNode } from './utils.js';

export function remarkInitializeAstroData() {
	return function (tree: any, vfile: VFile) {
		if (!vfile.data.astro) {
			vfile.data.astro = { frontmatter: {} };
		}
	};
}

export function rehypeApplyFrontmatterExport(pageFrontmatter: object, exportName = 'frontmatter') {
	return function (tree: any, vfile: VFile) {
		const frontmatter = { ...pageFrontmatter, ...safelyGetAstroData(vfile.data).frontmatter };
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
