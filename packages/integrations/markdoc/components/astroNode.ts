import type { AstroInstance } from 'astro';
import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import { MarkdocError } from '../dist/utils.js';
import z, { ZodError } from 'zod';

export type AstroNode =
	| string
	| {
			component: AstroInstance['default'];
			props: Record<string, any>;
			children: AstroNode[];
	  }
	| {
			tag: string;
			attributes: Record<string, any>;
			children: AstroNode[];
	  };

export function createAstroNode(
	node: RenderableTreeNode,
	components: Record<string, AstroInstance['default']> = {}
): AstroNode {
	components = validateComponents(components);

	if (typeof node === 'string' || typeof node === 'number') {
		return String(node);
	} else if (node === null || typeof node !== 'object' || !Markdoc.Tag.isTag(node)) {
		return '';
	}

	if (isCapitalized(node.name) && node.name in components) {
		const component = components[node.name];
		const props = node.attributes;
		const children = node.children.map((child) => createAstroNode(child, components));

		return {
			component,
			props,
			children,
		};
	} else if (isCapitalized(node.name)) {
		throw new MarkdocError({
			message: `Unable to render ${JSON.stringify(node.name)}.`,
			hint: 'Did you add this to the "components" prop on your <Content /> component?',
		});
	} else {
		return {
			tag: node.name,
			attributes: node.attributes,
			children: node.children.map((child) => createAstroNode(child, components)),
		};
	}
}

function validateComponents(components: Record<string, AstroInstance['default']>) {
	try {
		return z
			.record(
				z
					.string()
					.min(1, 'Invalid `components` prop. Component names cannot be empty!')
					.refine(
						(value) => isCapitalized(value),
						(value) => ({
							message: `Invalid \`components\` prop: ${JSON.stringify(
								value
							)}. Component name must be capitalized. If you want to render HTML elements as components, try using a Markdoc node [TODO: DOCS LINK]`,
						})
					),
				z.any()
			)
			.parse(components);
	} catch (e) {
		throw new MarkdocError({
			message:
				e instanceof ZodError
					? e.issues[0].message
					: 'Invalid `components` prop. Ensure you are passing an object of components to <Content />',
		});
	}
}

function isCapitalized(str: string) {
	return str.length > 0 && str[0] === str[0].toUpperCase();
}
