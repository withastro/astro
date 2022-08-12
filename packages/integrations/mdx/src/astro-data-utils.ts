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
		if (frontmatter.layout) {
			exportNodes.unshift(
				jsToTreeNode(
					/** @see 'vite-plugin-markdown' for layout props reference */
					`import { jsx as layoutJsx } from 'astro/jsx-runtime';
				import Layout from ${JSON.stringify(frontmatter.layout)};
				
				export default function ({ children }) {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;
					content.astro = {};
					Object.defineProperty(content.astro, 'headings', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "headings" from your layout, try using "Astro.props.headings."')
						}
					});
					Object.defineProperty(content.astro, 'html', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "html" from your layout, try using "Astro.props.compiledContent()."')
						}
					});
					Object.defineProperty(content.astro, 'source', {
						get() {
							throw new Error('The "astro" property is no longer supported! To access "source" from your layout, try using "Astro.props.rawContent()."')
						}
					});
					return layoutJsx(Layout, {
						content,
						frontmatter: content,
						headings: getHeadings(),
						'server:root': true,
						children,
					});
				};`
				)
			);
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
