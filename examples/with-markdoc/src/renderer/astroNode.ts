import { RenderableTreeNode, Tag, renderers, NodeType } from '@markdoc/markdoc';
import { escape } from 'html-escaper';

// TODO: expose `AstroComponentFactory` type from core
type AstroComponentFactory = (props: Record<string, any>) => any & {
	isAstroComponentFactory: true;
};

export type ComponentRenderer =
	| AstroComponentFactory
	| {
			component: AstroComponentFactory;
			props?(params: { attributes: Record<string, any>; getTreeNode(): Tag }): Record<string, any>;
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
	} else if (node === null || typeof node !== 'object' || !Tag.isTag(node)) {
		return '';
	}

	if (Object.hasOwn(components, node.name)) {
		const componentRenderer = components[node.name];
		const component =
			'Component' in componentRenderer ? componentRenderer.component : componentRenderer;
		const props =
			'props' in componentRenderer
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
