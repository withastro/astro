import type { Expression } from 'estree';
import {
	defineHastPlugin,
	type EstreeProgram,
	type HastNode,
	type HastPluginDefinition,
} from 'satteri';

type ScriptStyleNode = Extract<
	HastNode,
	{ type: 'element' | 'mdxJsxFlowElement' | 'mdxJsxTextElement' }
>;

function isScriptOrStyle(node: HastNode | undefined): node is ScriptStyleNode {
	if (!node) return false;
	if (node.type === 'element') return node.tagName === 'script' || node.tagName === 'style';
	if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
		return node.name === 'script' || node.name === 'style';
	}
	return false;
}

function hasSetDirective(node: ScriptStyleNode): boolean {
	if (node.type === 'element') {
		return Boolean(
			node.properties && ('set:html' in node.properties || 'set:text' in node.properties),
		);
	}
	return node.attributes.some(
		(attr) =>
			attr.type === 'mdxJsxAttribute' && (attr.name === 'set:html' || attr.name === 'set:text'),
	);
}

/**
 * Returns the literal string value of an MDX expression (e.g. `{'text'}` or
 * `` {`text`} ``), or `undefined` if it isn't a string/template literal with
 * no interpolated values.
 */
function literalExpressionValue(program: EstreeProgram | null): string | undefined {
	const statement = program?.body[0];
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
 * Replaces a `{'...'}`/`` {`...`} `` expression that's a direct child of
 * `<script>`/`<style>` with a plain text node when the expression is a literal
 * with no interpolated values, so plugin-independent literal content is later
 * recognized as static (see `collapseScriptStyleText`).
 */
export const literalizeScriptStyleExpression: HastPluginDefinition = defineHastPlugin({
	name: 'literalize-script-style-expression',
	mdxFlowExpression: (node, ctx) => {
		if (!isScriptOrStyle(ctx.parent(node))) return;
		const value = literalExpressionValue(node.parseExpression());
		if (value === undefined) return;
		return { type: 'text', value };
	},
	mdxTextExpression: (node, ctx) => {
		if (!isScriptOrStyle(ctx.parent(node))) return;
		const value = literalExpressionValue(node.parseExpression());
		if (value === undefined) return;
		return { type: 'text', value };
	},
});

/**
 * Collapses `<script>`/`<style>` children into a `set:html` attribute when
 * every child is now a plain text node (either originally static, or
 * literalized by `literalizeScriptStyleExpression`). Elements with any other
 * child (a real dynamic expression or component) are left untouched.
 */
export const collapseScriptStyleText: HastPluginDefinition = defineHastPlugin({
	name: 'collapse-script-style-text',
	element: { filter: ['script', 'style'], visit: collapseIfAllText },
	mdxJsxFlowElement: { filter: ['script', 'style'], visit: collapseIfAllText },
	mdxJsxTextElement: { filter: ['script', 'style'], visit: collapseIfAllText },
});

function collapseIfAllText(node: ScriptStyleNode, ctx: import('satteri').HastVisitorContext) {
	if (node.children.length === 0 || hasSetDirective(node)) return;

	let value = '';
	for (const child of node.children) {
		if (child.type !== 'text') return;
		value += child.value;
	}

	ctx.setProperty(node, 'set:html', value);
	for (let i = node.children.length - 1; i >= 0; i--) {
		ctx.removeChildAt(node, i);
	}
}
