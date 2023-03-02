import type { AstroInstance } from 'astro';
import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import z from 'zod';

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
		throw new Error(
			`[Markdoc] Unable to render ${JSON.stringify(
				node.name
			)}. Did you add this to the "components" prop on your <Content /> component?`
		);
	} else {
		return {
			tag: node.name,
			attributes: node.attributes,
			children: node.children.map((child) => createAstroNode(child, components)),
		};
	}
}

function validateComponents(components: Record<string, AstroInstance['default']>) {
	return z
		.record(
			z
				.string()
				.min(1, toComponentsKeyErrorMsg('Component name cannot be empty.'))
				.refine(
					(value) => isCapitalized(value),
					(value) => ({
						message: toComponentsKeyErrorMsg(
							`Component name must be capitalized (received ${JSON.stringify(
								value
							)}). If you want to render HTML elements as components, try using a Markdoc node [TODO: DOCS LINK]`
						),
					})
				),
			z.any()
		)
		.parse(components);
}

function toComponentsKeyErrorMsg(msg: string) {
	return '[Markdoc] Invalid "components" prop: ' + msg;
}

function isCapitalized(str: string) {
	return str.length > 0 && str[0] === str[0].toUpperCase();
}
