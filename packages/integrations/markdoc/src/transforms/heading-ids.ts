// ./schema/Heading.markdoc.js
import type { MarkdownHeading } from '@astrojs/markdown-remark';
import { Tag, type Schema, type Node, type RenderableTreeNode } from '@markdoc/markdoc';

// Or replace this with your own function
function generateId(attributes: Record<string, any>, textContent: string): string {
	if (attributes.id && typeof attributes.id === 'string') {
		return attributes.id;
	}
	return textContent.replace(/[?]/g, '').replace(/\s+/g, '-').toLowerCase();
}

function getTextContent(childNodes: Node[]) {
	let text = '';
	for (const node of childNodes) {
		if (node.inline && typeof node.attributes.content === 'string') {
			text += node.attributes.content;
		} else {
			text += getTextContent(node.children);
		}
	}
	return text;
}

export function createHeadingWithIdSchema(): { headings: MarkdownHeading[]; schema: Schema } {
	let headings: MarkdownHeading[] = [];
	const schema: Schema = {
		children: ['inline'],
		attributes: {
			id: { type: String },
			level: { type: Number, required: true, default: 1 },
		},
		transform(node, config) {
			const textContent = node.attributes.content ?? getTextContent(node.children);
			const attributes = node.transformAttributes(config);
			const children = node.transformChildren(config);

			const slug = generateId(attributes, textContent);
			headings.push({ slug, depth: attributes.level, text: textContent });

			return new Tag(`h${node.attributes['level']}`, { ...attributes, id: slug }, children);
		},
	};
	return { headings, schema };
}
