import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
import { escape } from 'html-escaper';

// TODO: expose `AstroComponentFactory` type from core
type AstroComponentFactory = (props: Record<string, any>) => any & {
	isAstroComponentFactory: true;
};

/**
 * Copied from Markdoc Tag.isTag implementation
 * to avoid dragging the whole 40kb Markdoc bundle into your build!
 */
function isTag(tag: any): tag is Tag {
	return !!(tag?.$$mdtype === 'Tag');
}

export type ComponentRenderer =
	| AstroComponentFactory
	| {
			component: AstroComponentFactory;
			props?(params: {
				attributes: Record<string, any>;
				getTreeNode(): import('@markdoc/markdoc').Tag;
			}): Record<string, any>;
	  };

export type AstroNode =
	| string
	| {
			component: AstroComponentFactory;
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
	components: Record<string, ComponentRenderer> = {}
): AstroNode {
	if (typeof node === 'string' || typeof node === 'number') {
		return escape(String(node));
	} else if (node === null || typeof node !== 'object' || !isTag(node)) {
		return '';
	}

	if (node.name in components) {
		const componentRenderer = components[node.name];
		const component =
			'component' in componentRenderer ? componentRenderer.component : componentRenderer;
		const props =
			'props' in componentRenderer && typeof componentRenderer.props === 'function'
				? componentRenderer.props({
						attributes: node.attributes,
						getTreeNode() {
							return node;
						},
				  })
				: node.attributes;

		const children = node.children.map((child) => createAstroNode(child, components));

		return {
			component,
			props,
			children,
		};
	} else {
		return {
			tag: node.name,
			attributes: node.attributes,
			children: node.children.map((child) => createAstroNode(child, components)),
		};
	}
}
