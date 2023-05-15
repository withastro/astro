// ./schema/Heading.markdoc.js
import type { MarkdownHeading } from '@astrojs/markdown-remark';
import Markdoc, { type Schema, type RenderableTreeNode } from '@markdoc/markdoc';

// Or replace this with your own function
function generateId(attributes: Record<string, any>, textContent: string): string {
	if (attributes.id && typeof attributes.id === 'string') {
		return attributes.id;
	}
	return textContent.replace(/[?]/g, '').replace(/\s+/g, '-').toLowerCase();
}

function getTextContent(childNodes: RenderableTreeNode[]) {
	let text = '';
	for (const node of childNodes) {
		if (typeof node === 'string' || typeof node === 'number') {
			text += node;
		} else if (typeof node === 'object' && Markdoc.Tag.isTag(node)) {
			text += getTextContent(node.children);
		}
	}
	return text;
}

export function createHeadingNode(): { headings: MarkdownHeading[]; schema: Schema } {
	let headings: MarkdownHeading[] = [];
	const schema: Schema = {
		children: ['inline'],
		attributes: {
			id: { type: String },
			level: { type: Number, required: true, default: 1 },
		},
		transform(node, config) {
			const { level, ...attributes } = node.transformAttributes(config);
			const children = node.transformChildren(config);
			const textContent = node.attributes.content ?? getTextContent(children);

			const slug = generateId(attributes, textContent);
			headings.push({ slug, depth: level, text: textContent });

			return new Markdoc.Tag(`h${level}`, { ...attributes, id: slug }, children);
		},
	};
	return { headings, schema };
}
