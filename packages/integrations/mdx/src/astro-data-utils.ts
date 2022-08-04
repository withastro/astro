import type { VFile } from 'vfile';
import type { MdxjsEsm } from 'mdast-util-mdx';
import type { MarkdownAstroData } from 'astro';
import type { Data } from 'vfile';
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

function isValidAstroData(obj: unknown): obj is MarkdownAstroData {
	if (typeof obj === 'object' && obj !== null && obj.hasOwnProperty('frontmatter')) {
		const { frontmatter } = obj as any;
		try {
			// ensure frontmatter is JSON-serializable
			JSON.stringify(frontmatter);
		} catch {
			return false;
		}
		return typeof frontmatter === 'object' && frontmatter !== null;
	}
	return false;
}

export function safelyGetAstroData(vfileData: Data): MarkdownAstroData {
	const { astro } = vfileData;

	if (!astro) return { frontmatter: {} };
	if (!isValidAstroData(astro)) {
		throw Error(
			`[Markdown] A remark or rehype plugin tried to add invalid frontmatter. Ensure "astro.frontmatter" is a JSON object!`
		);
	}

	return astro;
}
