import type { MarkdownAstroData } from 'astro';
import { name as isValidIdentifierName } from 'estree-util-is-identifier-name';
import type { MdxjsEsm } from 'mdast-util-mdx';
import type { Data, VFile } from 'vfile';
import { jsToTreeNode } from './utils.js';

export function remarkInitializeAstroData() {
	return function (tree: any, vfile: VFile) {
		if (!vfile.data.astro) {
			vfile.data.astro = { frontmatter: {} };
		}
	};
}

export function rehypeApplyFrontmatterExport(
	pageFrontmatter: Record<string, any>,
	exportName = 'frontmatter'
) {
	return function (tree: any, vfile: VFile) {
		if (!isValidIdentifierName(exportName)) {
			throw new Error(
				`[MDX] ${JSON.stringify(
					exportName
				)} is not a valid frontmatter export name! Make sure "frontmatterOptions.name" could be used as a JS export (i.e. "export const frontmatterName = ...")`
			);
		}
		const { frontmatter: injectedFrontmatter } = safelyGetAstroData(vfile.data);
		const frontmatter = { ...injectedFrontmatter, ...pageFrontmatter };
		let exportNodes: MdxjsEsm[] = [];
		if (!exportName) {
			exportNodes = Object.entries(frontmatter).map(([k, v]) => {
				if (!isValidIdentifierName(k)) {
					throw new Error(
						`[MDX] A remark or rehype plugin tried to inject ${JSON.stringify(
							k
						)} as a top-level export, which is not a valid export name.`
					);
				}
				return jsToTreeNode(`export const ${k} = ${JSON.stringify(v)};`);
			});
		} else {
			exportNodes = [jsToTreeNode(`export const ${exportName} = ${JSON.stringify(frontmatter)};`)];
		}
		tree.children = exportNodes.concat(tree.children);
	};
}

/**
 * Copied from markdown utils
 * @see "vite-plugin-utils"
 */
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

/**
 * Copied from markdown utils
 * @see "vite-plugin-utils"
 */
export function safelyGetAstroData(vfileData: Data): MarkdownAstroData {
	const { astro } = vfileData;

	if (!astro) return { frontmatter: {} };
	if (!isValidAstroData(astro)) {
		throw Error(
			`[MDX] A remark or rehype plugin tried to add invalid frontmatter. Ensure "astro.frontmatter" is a JSON object!`
		);
	}

	return astro;
}
