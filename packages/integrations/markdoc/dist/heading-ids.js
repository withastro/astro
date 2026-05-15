import Markdoc from '@markdoc/markdoc';
import Slugger from 'github-slugger';
import { getTextContent } from './runtime.js';
import { MarkdocError } from './utils.js';
function getSlug(attributes, children, headingSlugger) {
	if (attributes.id && typeof attributes.id === 'string') {
		return attributes.id;
	}
	const textContent = attributes.content ?? getTextContent(children);
	return headingSlugger.slug(textContent);
}
const heading = {
	children: ['inline'],
	attributes: {
		id: { type: String },
		level: { type: Number, required: true, default: 1 },
	},
	transform(node, config) {
		const { level, ...attributes } = node.transformAttributes(config);
		const children = node.transformChildren(config);
		if (!config.ctx?.headingSlugger) {
			throw new MarkdocError({
				message:
					'Unexpected problem adding heading IDs to Markdoc file. Did you modify the `ctx.headingSlugger` property in your Markdoc config?',
			});
		}
		const slug = getSlug(attributes, children, config.ctx.headingSlugger);
		const render = config.nodes?.heading?.render ?? `h${level}`;
		const tagProps =
			// For components, pass down `level` as a prop,
			// alongside `__collectHeading` for our `headings` collector.
			// Avoid accidentally rendering `level` as an HTML attribute otherwise!
			typeof render === 'string'
				? { ...attributes, id: slug }
				: { ...attributes, id: slug, __collectHeading: true, level };
		return new Markdoc.Tag(render, tagProps, children);
	},
};
function setupHeadingConfig() {
	const headingSlugger = new Slugger();
	return {
		ctx: {
			headingSlugger,
		},
		nodes: {
			heading,
		},
	};
}
export { heading, setupHeadingConfig };
