import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isFrontmatterValid } from '@astrojs/markdown-remark';
import { jsToTreeNode } from './utils.js';
const exportConstPartialTrueRe = /export\s+const\s+partial\s*=\s*true/;
function rehypeApplyFrontmatterExport() {
	return function (tree, vfile) {
		const frontmatter = vfile.data.astro?.frontmatter;
		if (!frontmatter || !isFrontmatterValid(frontmatter))
			throw new Error(
				// Copied from Astro core `errors-data`
				// TODO: find way to import error data from core
				'[MDX] A remark or rehype plugin attempted to inject invalid frontmatter. Ensure "astro.frontmatter" is set to a valid JSON object that is not `null` or `undefined`.',
			);
		const extraChildren = [
			jsToTreeNode(`export const frontmatter = ${JSON.stringify(frontmatter)};`),
		];
		if (frontmatter.layout) {
			extraChildren.unshift(
				jsToTreeNode(
					// NOTE: Use `__astro_*` import names to prevent conflicts with user code
					/** @see 'vite-plugin-markdown' for layout props reference */
					`import { jsx as __astro_layout_jsx__ } from 'astro/jsx-runtime';
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
		} else if (shouldAddCharset(tree, vfile)) {
			extraChildren.unshift({
				type: 'mdxJsxFlowElement',
				name: 'meta',
				attributes: [
					{
						type: 'mdxJsxAttribute',
						name: 'charset',
						value: 'utf-8',
					},
				],
				children: [],
			});
		}
		tree.children = extraChildren.concat(tree.children);
	};
}
function shouldAddCharset(tree, vfile) {
	const srcDirUrl = vfile.data.applyFrontmatterExport?.srcDir;
	if (!srcDirUrl) return false;
	const hasConstPartialTrue = tree.children.some(
		(node) => node.type === 'mdxjsEsm' && exportConstPartialTrueRe.test(node.value),
	);
	if (hasConstPartialTrue) return false;
	const pagesDir = path.join(fileURLToPath(srcDirUrl), 'pages').replace(/\\/g, '/');
	const filePath = vfile.path;
	if (!filePath.startsWith(pagesDir)) return false;
	const hasLeadingUnderscoreInPath = filePath
		.slice(pagesDir.length)
		.replace(/\\/g, '/')
		.split('/')
		.some((part) => part.startsWith('_'));
	if (hasLeadingUnderscoreInPath) return false;
	for (const child of tree.children) {
		if (child.type === 'element') break;
		if (child.type === 'mdxJsxFlowElement') {
			if (child.name == null) break;
			if (child.name[0] === child.name[0].toLowerCase()) break;
			return false;
		}
	}
	return true;
}
export { rehypeApplyFrontmatterExport };
