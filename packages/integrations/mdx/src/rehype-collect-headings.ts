import Slugger from 'github-slugger';
import { visit } from 'unist-util-visit';

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}

export default function createCollectHeadings() {
	const fileIdToHeadingsMap = new Map<string, MarkdownHeading[]>();
	const slugger = new Slugger();

	function rehypeCollectHeadings(fileId: string) {
		return function (tree: any) {
			// Reset headings on each render
			fileIdToHeadingsMap.set(fileId, []);
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
				if (fileIdToHeadingsMap.has(fileId)) {

				}

				fileIdToHeadingsMap.set(
					fileId,
					[
						...(fileIdToHeadingsMap.get(fileId) ?? []),
						{ depth, slug: node.properties.id, text },
					],
				);
			});
		};
	}

	return {
		fileIdToHeadingsMap,
		rehypeCollectHeadings,
	};
}
