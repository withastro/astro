import Markdoc, { type Schema } from '@markdoc/markdoc';
import { getTextContent } from '../runtime.js';

// Or replace this with your own function
function generateId(attributes: Record<string, any>, textContent: string): string {
	if (attributes.id && typeof attributes.id === 'string') {
		return attributes.id;
	}
	return textContent.replace(/[?]/g, '').replace(/\s+/g, '-').toLowerCase();
}

export const heading: Schema = {
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

		const render = config.nodes?.heading?.render ?? `h${level}`;
		const tagProps =
			// For components, pass down `level` as a prop,
			// alongside `__collectHeading` for our `headings` collector.
			// Avoid accidentally rendering `level` as an HTML attribute otherwise!
			typeof render === 'function'
				? { ...attributes, id: slug, __collectHeading: true, level }
				: { ...attributes, id: slug };

		return new Markdoc.Tag(render, tagProps, children);
	},
};
