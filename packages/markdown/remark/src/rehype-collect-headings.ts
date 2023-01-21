import Slugger from 'github-slugger';
import { visit } from 'unist-util-visit';

import type { MarkdownHeading, MarkdownVFile, RehypePlugin } from './types.js';

const rawNodeTypes = new Set(['text', 'raw', 'mdxTextExpression']);
const codeTagNames = new Set(['code', 'pre']);

export function rehypeHeadingIds(): ReturnType<RehypePlugin> {
	return function (tree, file: MarkdownVFile) {
		const headings: MarkdownHeading[] = [];
		const slugger = new Slugger();
		const isMDX = isMDXFile(file);
		visit(tree, (node) => {
			if (node.type !== 'element') return;
			const { tagName } = node;
			if (tagName[0] !== 'h') return;
			const [_, level] = tagName.match(/h([0-6])/) ?? [];
			if (!level) return;
			const depth = Number.parseInt(level);

			let text = '';
			visit(node, (child, __, parent) => {
				if (child.type === 'element' || parent == null) {
					return;
				}
				if (child.type === 'raw') {
					if (child.value.match(/^\n?<.*>\n?$/)) {
						return;
					}
				}
				if (rawNodeTypes.has(child.type)) {
					if (isMDX || codeTagNames.has(parent.tagName)) {
						text += child.value;
					} else {
						text += child.value.replace(/\{/g, '${');
					}
				}
			});

			node.properties = node.properties || {};
			if (typeof node.properties.id !== 'string') {
				let slug = slugger.slug(text);

				if (slug.endsWith('-')) slug = slug.slice(0, -1);

				node.properties.id = slug;
			}

			headings.push({ depth, slug: node.properties.id, text });
		});

		file.data.__astroHeadings = headings;
	};
}

function isMDXFile(file: MarkdownVFile) {
	return Boolean(file.history[0]?.endsWith('.mdx'));
}
