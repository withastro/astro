import { visit } from 'unist-util-visit';
import slugger from 'github-slugger';

/**  */
export default function createCollectHeaders() {
	const headers: any[] = [];

	function rehypeCollectHeaders() {
		return function (tree: any) {
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

				if (!node.properties) node.properties = {};

				if (!node.properties.id) {
					let slug = slugger.slug(text);
					
					if (slug.endsWith('-')) slug = slug.slice(0, -1);
					
					node.properties.id = slug;
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
