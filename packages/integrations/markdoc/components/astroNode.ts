import type { AstroInstance } from 'astro';
import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import { MarkdocError, isCapitalized } from '../dist/utils.js';

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
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node);
	} else if (node === null || typeof node !== 'object' || !Markdoc.Tag.isTag(node)) {
		return '';
	}

	if (node.name in components) {
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
