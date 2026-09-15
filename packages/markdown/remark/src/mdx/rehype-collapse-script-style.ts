import type { RehypePlugin } from '@astrojs/internal-helpers/markdown';
import type { Expression, Program } from 'estree';
import type { Element } from 'hast';
import type {} from 'mdast-util-mdx';
import type { MdxJsxFlowElementHast, MdxJsxTextElementHast } from 'mdast-util-mdx-jsx';
import { visit } from 'unist-util-visit';

type ScriptStyleNode = Element | MdxJsxFlowElementHast | MdxJsxTextElementHast;

function isScriptOrStyle(node: unknown): node is ScriptStyleNode {
	if (!node || typeof node !== 'object') return false;
	const { type } = node as { type: string };
	if (type === 'element') {
		return (node as Element).tagName === 'script' || (node as Element).tagName === 'style';
	}
	if (type === 'mdxJsxFlowElement' || type === 'mdxJsxTextElement') {
		const name = (node as MdxJsxFlowElementHast | MdxJsxTextElementHast).name;
		return name === 'script' || name === 'style';
	}
	return false;
}

function hasSetDirective(node: ScriptStyleNode) {
	if (node.type === 'element') {
		return 'set:html' in node.properties || 'set:text' in node.properties;
	}
	return node.attributes.some(
		(attr) =>
			attr.type === 'mdxJsxAttribute' && (attr.name === 'set:html' || attr.name === 'set:text'),
	);
}

/**
 * Returns the literal string value of an MDX expression child (e.g. `{'text'}` or
 * `` {`text`} ``), or `undefined` if the expression isn't a string/template literal
 * with no interpolated values.
 */
function literalExpressionValue(node: { data?: { estree?: Program } }): string | undefined {
	const statement = node.data?.estree?.body[0];
	if (statement?.type !== 'ExpressionStatement') return undefined;
	const expression: Expression = statement.expression;
	if (expression.type === 'Literal' && typeof expression.value === 'string') {
		return expression.value;
	}
	if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0) {
		return expression.quasis[0]?.value.cooked ?? undefined;
	}
	return undefined;
}

/**
 * Collapses the literal string content of a `<script>`/`<style>` element's children
 * into a `set:html` attribute, matching the literal value of a `{'...'}`/`` {`...`} ``
 * child that a plugin (e.g. rehype-mathjax) or an author injected as static content.
 * Returns `undefined` if any child isn't a plain-text or literal-expression node.
 */
function collapseLiteralChildren(children: unknown[]): string | undefined {
	let value = '';
	for (const child of children) {
		const node = child as { type: string; value?: string; data?: { estree?: Program } };
		if (node.type === 'text') {
			value += node.value;
		} else if (node.type === 'mdxTextExpression' || node.type === 'mdxFlowExpression') {
			const literal = literalExpressionValue(node);
			if (literal === undefined) return undefined;
			value += literal;
		} else {
			return undefined;
		}
	}
	return value;
}

/**
 * For MDX `<script>`/`<style>` elements, collapses literal (non-interpolated) string
 * content into a `set:html` attribute instead of leaving it as JSX children. This lets
 * the renderer treat literal author- or plugin-authored code/CSS as trusted, the same
 * way `set:html` already works, while any remaining dynamic children are rendered
 * (and escaped) normally.
 */
export const rehypeCollapseScriptStyle: RehypePlugin = () => {
	return (tree) => {
		visit(tree as any, (node: ScriptStyleNode) => {
			if (!isScriptOrStyle(node) || node.children.length === 0 || hasSetDirective(node)) return;

			const value = collapseLiteralChildren(node.children as unknown[]);
			if (value === undefined) return;

			if (node.type === 'element') {
				node.properties['set:html'] = value;
			} else {
				node.attributes.push({ type: 'mdxJsxAttribute', name: 'set:html', value });
			}
			node.children = [];
		});
	};
};
