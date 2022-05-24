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
					if (isJSX) {
						// HACK: for ids that have JSX content, use $$slug helper to generate slug at runtime
						node.properties.id = `$$slug(\`${text.replace(/\{/g, '${')}\`)`;
						(node as any).type = 'raw';
						(
							node as any
						).value = `<${node.tagName} id={${node.properties.id}}>${raw}</${node.tagName}>`;
					} else {
						node.properties.id = slugger.slug(text);
					}
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
