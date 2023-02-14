import type { ComponentInstance } from 'astro';
import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';

export type ComponentRenderer =
	| ComponentInstance['default']
	| {
			component: ComponentInstance['default'];
			props?(params: { attributes: Record<string, any>; getTreeNode(): Tag }): Record<string, any>;
	  };

export type AstroNode =
	| string
	| {
			component: ComponentInstance['default'];
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
		return String(node);
	} else if (node === null || typeof node !== 'object' || !Markdoc.Tag.isTag(node)) {
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
