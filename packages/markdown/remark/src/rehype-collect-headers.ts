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

				let raw = '';
				let text = '';
				let isJSX = false;
				visit(node, (child) => {
					if (child.type === 'element') {
						return;
					}
					if (child.type === 'raw') {
						// HACK: serialized JSX from internal plugins, ignore these for slug
						if (child.value.startsWith('\n<') || child.value.endsWith('>\n')) {
							raw += child.value.replace(/^\n|\n$/g, '');
							return;
						}
					}
					if (child.type === 'text' || child.type === 'raw') {
						raw += child.value;
						text += child.value;
						isJSX = isJSX || child.value.includes('{');
					}
				});

				node.properties = node.properties || {};
				if (typeof node.properties.id !== 'string') {
					node.properties.id = slugger.slug(text);
					// TODO: restore fix for IDs from JSX expressions
					// Reverted due to https://github.com/withastro/astro/issues/3443
					// See https://github.com/withastro/astro/pull/3410/files#diff-f0cc828ac662d9b8d48cbb9cb147883e319cdd8fa24f24ef401960520f1436caR44-R51
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
