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
				'[MDX] A remark or rehype plugin attempted to inject invalid frontmatter. Ensure "astro.frontmatter" is set to a valid JSON object that is not `null` or `undefined`.'
			);
		const { frontmatter } = astroData;
		const exportNodes = [
			jsToTreeNode(`export const frontmatter = ${JSON.stringify(frontmatter)};`),
		];
		if (frontmatter.layout) {
			// NOTE(bholmesdev) 08-22-2022
			// Using an async layout import (i.e. `const Layout = (await import...)`)
			// Preserves the dev server import cache when globbing a large set of MDX files
			// Full explanation: 'https://github.com/withastro/astro/pull/4428'
			exportNodes.unshift(
				jsToTreeNode(
					/** @see 'vite-plugin-markdown' for layout props reference */
					`import { jsx as layoutJsx } from 'astro/jsx-runtime';

				export default async function ({ children }) {
					const Layout = (await import(${JSON.stringify(frontmatter.layout)})).default;
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;
					return layoutJsx(Layout, {
						file,
						url,
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
