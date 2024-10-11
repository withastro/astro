import { InvalidAstroDataError } from '@astrojs/markdown-remark';
import { safelyGetAstroData } from '@astrojs/markdown-remark/dist/internal.js';
import type { VFile } from 'vfile';
import { jsToTreeNode } from './utils.js';

export function rehypeApplyFrontmatterExport() {
	return function (tree: any, vfile: VFile) {
		const astroData = safelyGetAstroData(vfile.data);
		if (astroData instanceof InvalidAstroDataError)
			throw new Error(
				// Copied from Astro core `errors-data`
				// TODO: find way to import error data from core
				'[MDX] A remark or rehype plugin attempted to inject invalid frontmatter. Ensure "astro.frontmatter" is set to a valid JSON object that is not `null` or `undefined`.',
			);
		const { frontmatter } = astroData;
		const exportNodes = [
			jsToTreeNode(`export const frontmatter = ${JSON.stringify(frontmatter)};`),
		];
		if (frontmatter.layout) {
			exportNodes.unshift(
				jsToTreeNode(
					// NOTE: Use `__astro_*` import names to prevent conflicts with user code
					/** @see 'vite-plugin-markdown' for layout props reference */
					`\
import { jsx as __astro_layout_jsx__ } from 'astro/jsx-runtime';
import __astro_layout_component__ from ${JSON.stringify(frontmatter.layout)};

export default function ({ children }) {
	const { layout, ...content } = frontmatter;
	content.file = file;
	content.url = url;
	return __astro_layout_jsx__(__astro_layout_component__, {
		file,
		url,
		content,
		frontmatter: content,
		headings: getHeadings(),
		'server:root': true,
		children,
	});
};`,
				),
			);
		}
		tree.children = exportNodes.concat(tree.children);
	};
}
