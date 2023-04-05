import type { AstroInstance } from 'astro';
import { Fragment } from 'astro/jsx-runtime';
import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import {
	createComponent,
	renderComponent,
	render,
	renderStyleElement,
	renderScriptElement,
	renderUniqueStylesheet,
	createHeadAndContent,
	unescapeHTML,
	renderTemplate,
} from 'astro/runtime/server/index.js';

export type TreeNode =
	| {
			type: 'text';
			content: string;
	  }
	| {
			type: 'component';
			component: AstroInstance['default'];
			collectedLinks?: string[];
			collectedStyles?: string[];
			collectedScripts?: string[];
			props: Record<string, any>;
			children: TreeNode[];
	  }
	| {
			type: 'element';
			tag: string;
			attributes: Record<string, any>;
			children: TreeNode[];
	  };

export const ComponentNode = createComponent({
	factory(result: any, { treeNode }: { treeNode: TreeNode }) {
		if (treeNode.type === 'text') return render`${treeNode.content}`;
		const slots = {
			default: () =>
				render`${treeNode.children.map((child) =>
					renderComponent(result, 'ComponentNode', ComponentNode, { treeNode: child })
				)}`,
		};
		if (treeNode.type === 'component') {
			let styles = '',
				links = '',
				scripts = '';
			if (Array.isArray(treeNode.collectedStyles)) {
				styles = treeNode.collectedStyles.map((style: any) => renderStyleElement(style)).join('');
			}
			if (Array.isArray(treeNode.collectedLinks)) {
				links = treeNode.collectedLinks
					.map((link: any) => {
						return renderUniqueStylesheet(result, {
							href: link[0] === '/' ? link : '/' + link,
						});
					})
					.join('');
			}
			if (Array.isArray(treeNode.collectedScripts)) {
				scripts = treeNode.collectedScripts
					.map((script: any) => renderScriptElement(script))
					.join('');
			}

			const head = unescapeHTML(styles + links + scripts);

			let headAndContent = createHeadAndContent(
				head,
				renderTemplate`${renderComponent(
					result,
					treeNode.component.name,
					treeNode.component,
					treeNode.props,
					slots
				)}`
			);

			console.log('[Markdoc renderer] Setting propagator');
			// Let the runtime know that this component is being used.
			result.propagators.set(
				{},
				{
					init() {
						return headAndContent;
					},
				}
			);

			return headAndContent;
		}
		return renderComponent(result, treeNode.tag, treeNode.tag, treeNode.attributes, slots);
	},
	propagation: 'self',
});

export async function createTreeNode(
	node: RenderableTreeNode | RenderableTreeNode[]
): Promise<TreeNode> {
	if (typeof node === 'string' || typeof node === 'number') {
		return { type: 'text', content: String(node) };
	} else if (Array.isArray(node)) {
		return {
			type: 'component',
			component: Fragment,
			props: {},
			children: await Promise.all(node.map((child) => createTreeNode(child))),
		};
	} else if (node === null || typeof node !== 'object' || !Markdoc.Tag.isTag(node)) {
		return { type: 'text', content: '' };
	}

	const children = await Promise.all(node.children.map((child) => createTreeNode(child)));

	if (typeof node.name === 'function') {
		const component = node.name;
		const props = node.attributes;

		return {
			type: 'component',
			component,
			props,
			children,
		};
	} else if (isPropagatedAssetsModule(node.name)) {
		const { collectedStyles, collectedLinks, collectedScripts } = node.name;
		const component = (await node.name.getMod())?.default ?? Fragment;
		const props = node.attributes;

		return {
			type: 'component',
			component,
			collectedStyles,
			collectedLinks,
			collectedScripts,
			props,
			children,
		};
	} else {
		return {
			type: 'element',
			tag: node.name,
			attributes: node.attributes,
			children,
		};
	}
}

type PropagatedAssetsModule = {
	__astroPropagation: true;
	getMod: () => Promise<AstroInstance['default']>;
	collectedStyles: string[];
	collectedLinks: string[];
	collectedScripts: string[];
};

function isPropagatedAssetsModule(module: any): module is PropagatedAssetsModule {
	return typeof module === 'object' && module != null && '__astroPropagation' in module;
}
