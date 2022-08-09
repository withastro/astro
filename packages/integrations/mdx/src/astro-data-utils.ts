import type { MarkdownAstroData } from 'astro';
import type { Data, VFile } from 'vfile';
import { jsToTreeNode } from './utils.js';

export function remarkInitializeAstroData() {
	return function (tree: any, vfile: VFile) {
		if (!vfile.data.astro) {
			vfile.data.astro = { frontmatter: {} };
		}
	};
}

const EXPORT_NAME = 'frontmatter';

export function rehypeApplyFrontmatterExport(pageFrontmatter: Record<string, any>) {
	return function (tree: any, vfile: VFile) {
		const { frontmatter: injectedFrontmatter } = safelyGetAstroData(vfile.data);
		const frontmatter = { ...injectedFrontmatter, ...pageFrontmatter };
		const exportNodes = [
			jsToTreeNode(`export const ${EXPORT_NAME} = ${JSON.stringify(frontmatter)};`),
		];
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
