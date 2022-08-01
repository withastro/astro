import Slugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import { jsToTreeNode } from './utils.js';

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}

export default function rehypeCollectHeadings() {
	const slugger = new Slugger();
	return function (tree: any) {
		const headings: MarkdownHeading[] = [];
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
				if (child.type === 'raw' && child.value.match(/^\n?<.*>\n?$/)) {
					return;
				}
				if (new Set(['text', 'raw', 'mdxTextExpression']).has(child.type)) {
					text += child.value;
				}
			});

			node.properties = node.properties || {};
			if (typeof node.properties.id !== 'string') {
				let slug = slugger.slug(text);
				if (slug.endsWith('-')) {
					slug = slug.slice(0, -1);
				}
				node.properties.id = slug;
			}
			headings.push({ depth, slug: node.properties.id, text });
		});
		tree.children.unshift(
			jsToTreeNode(`export function getHeadings() { return ${JSON.stringify(headings)} }`)
		);
	};
}
