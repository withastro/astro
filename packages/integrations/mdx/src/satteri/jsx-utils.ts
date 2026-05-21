import type { MdxJsxAttributeNode, MdxJsxFlowElementHast, MdxJsxTextElementHast } from 'satteri';

// JSX-specific helpers used by the MDX pipeline. Non-MDX equivalents (e.g.
// `makeFragmentNode`, `collectHastText`) live in `@astrojs/markdown-satteri`
// because they're shared with the markdown render pipeline.

// Sätteri hands plugin visitors readonly nodes; these helpers only read them.
export type MdxJsxHastNode = Readonly<MdxJsxFlowElementHast | MdxJsxTextElementHast>;

const nonAlphaRe = /[^a-zA-Z]/;

export function isComponent(tagName: string): boolean {
	return (
		(tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
		tagName.includes('.') ||
		nonAlphaRe.test(tagName[0])
	);
}

export function hasDirective(node: MdxJsxHastNode, prefix: string): boolean {
	for (const a of node.attributes) {
		if (a.type === 'mdxJsxAttribute' && a.name.startsWith(prefix)) return true;
	}
	return false;
}

export function findAttrValue(node: MdxJsxHastNode, name: string): string | null {
	for (const a of node.attributes) {
		if (a.type === 'mdxJsxAttribute' && a.name === name) {
			return typeof a.value === 'string' ? a.value : null;
		}
	}
	return null;
}

export function makeJsxAttr(name: string, value: string): MdxJsxAttributeNode {
	return { type: 'mdxJsxAttribute', name, value };
}

export function makeJsxExprAttr(name: string, expression: string): MdxJsxAttributeNode {
	return {
		type: 'mdxJsxAttribute',
		name,
		value: { type: 'mdxJsxAttributeValueExpression', value: expression },
	};
}
