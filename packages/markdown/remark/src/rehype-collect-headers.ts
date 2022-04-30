import { visit } from 'unist-util-visit';
import Slugger from 'github-slugger';

import type { MarkdownHeader, RehypePlugin } from './types.js';

export default function createCollectHeaders() {
	const headers: MarkdownHeader[] = [];
	const slugger = new Slugger();

	function rehypeCollectHeaders(): ReturnType<RehypePlugin> {
		return function (tree) {
			visit(tree, (node) => {
				if (node.type !== 'element') return;
				const { tagName } = node;
				if (tagName[0] !== 'h') return;
				const [_, level] = tagName.match(/h([0-6])/) ?? [];
				if (!level) return;
				const depth = Number.parseInt(level);

				let text = '';

				visit(node, 'text', (child) => {
					text += child.value;
				});

				node.properties = node.properties || {};
				if (typeof node.properties.id !== 'string') {
					node.properties.id = slugger.slug(text);
				}

				headers.push({ depth, slug: node.properties.id, text });
			});
		};
	}

	return {
		headers,
		rehypeCollectHeaders,
	};
}
