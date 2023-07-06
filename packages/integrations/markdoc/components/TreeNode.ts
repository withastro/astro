import type { AstroInstance } from 'astro';
import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import {
	createComponent,
	renderComponent,
	render,
	renderScriptElement,
	renderUniqueStylesheet,
	createHeadAndContent,
	unescapeHTML,
	renderTemplate,
	HTMLString,
	isHTMLString,
} from 'astro/runtime/server/index.js';

export type TreeNode =
	| {
			type: 'text';
			content: string | HTMLString;
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
				styles = treeNode.collectedStyles
					.map((style: any) =>
						renderUniqueStylesheet(result, {
							type: 'inline',
							content: style,
						})
					)
					.join('');
			}
			if (Array.isArray(treeNode.collectedLinks)) {
				links = treeNode.collectedLinks
					.map((link: any) => {
						return renderUniqueStylesheet(result, {
							type: 'external',
							src: link[0] === '/' ? link : '/' + link,
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

			// Let the runtime know that this component is being used.
			// `result.propagators` has been moved to `result._metadata.propagators`
			// TODO: remove this fallback in the next markdoc integration major
			const propagators = result._metadata.propagators || result.propagators;
			propagators.set(
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

export async function createTreeNode(node: RenderableTreeNode): Promise<TreeNode> {
	if (isHTMLString(node)) {
		return { type: 'text', content: node as HTMLString };
	} else if (typeof node === 'string' || typeof node === 'number') {
		return { type: 'text', content: String(node) };
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
		const component = (await node.name.getMod()).default;
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
	getMod: () => Promise<AstroInstance>;
	collectedStyles: string[];
	collectedLinks: string[];
	collectedScripts: string[];
};

function isPropagatedAssetsModule(module: any): module is PropagatedAssetsModule {
	return typeof module === 'object' && module != null && '__astroPropagation' in module;
}
