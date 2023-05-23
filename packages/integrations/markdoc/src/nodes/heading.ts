import Markdoc, { type ConfigType, type RenderableTreeNode, type Schema } from '@markdoc/markdoc';
import Slugger from 'github-slugger';
import { getTextContent } from '../runtime.js';

type ConfigTypeWithCtx = ConfigType & {
	// TODO: decide on `ctx` as a convention for config merging
	ctx: {
		headingSlugger: Slugger;
	};
};

function getSlug(
	attributes: Record<string, any>,
	children: RenderableTreeNode[],
	headingSlugger: Slugger
): string {
	if (attributes.id && typeof attributes.id === 'string') {
		return attributes.id;
	}
	const textContent = attributes.content ?? getTextContent(children);
	let slug = headingSlugger.slug(textContent);

	if (slug.endsWith('-')) slug = slug.slice(0, -1);
	return slug;
}

export const heading: Schema = {
	children: ['inline'],
	attributes: {
		id: { type: String },
		level: { type: Number, required: true, default: 1 },
	},
	transform(node, config: ConfigTypeWithCtx) {
		const { level, ...attributes } = node.transformAttributes(config);
		const children = node.transformChildren(config);

		const slug = getSlug(attributes, children, config.ctx.headingSlugger);

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

export function setupHeadingConfig(): ConfigTypeWithCtx {
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
