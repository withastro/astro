import type { Node } from 'estree-walker';
import type MagicString from 'magic-string';

export function mutatePageMapInPlace(
	node: Extract<Node, { type: 'VariableDeclaration' }>,
	constsToRemove: string[],
	s: MagicString
) {
	const declarator = node.declarations[0];
	if (declarator.id.type !== 'Identifier') return;
	if (declarator.id.name !== 'pageMap') return;
	if (!declarator.init || declarator.init.type !== 'NewExpression') return;
	if (!declarator.init.arguments[0] || declarator.init.arguments[0].type !== 'ArrayExpression')
		return;

	for (const arrayExpression of declarator.init.arguments[0].elements) {
		if (!arrayExpression || arrayExpression.type !== 'ArrayExpression') continue;
		if (!arrayExpression.elements[1] || arrayExpression.elements[1].type !== 'Identifier') continue;

		if (constsToRemove.includes(arrayExpression.elements[1].name)) {
			// @ts-expect-error - @types/estree seem to be wrong
			if (arrayExpression.start && arrayExpression.end) {
				// @ts-expect-error - @types/estree seem to be wrong
				s.remove(arrayExpression.start, arrayExpression.end);

				// We need to check if there are any leftover commas, which are not part of the `ArrayExpression` node
				// @ts-expect-error - @types/estree seem to be wrong
				const endChar = s.slice(arrayExpression.end, arrayExpression.end + 1);
				if (endChar.includes(',')) {
					// @ts-expect-error - @types/estree seem to be wrong
					s.remove(arrayExpression.end, arrayExpression.end + 1);
				}
			}
		}
	}
}

export function mutateDynamicPageImportsInPlace(
	node: Extract<Node, { type: 'VariableDeclaration' }>,
	prerenderImports: string[],
	constsToRemove: string[],
	s: MagicString
) {
	const declarator = node.declarations[0];
	if (declarator.id.type !== 'Identifier') return;
	if (!declarator.id.name.startsWith('_page')) return;
	if (!declarator.init || declarator.init.type !== 'ArrowFunctionExpression') return;
	if (!declarator.init.body || declarator.init.body.type !== 'ImportExpression') return;
	if (!declarator.init.body.source || declarator.init.body.source.type !== 'Literal') return;

	const sourceValue = declarator.init.body.source.value;
	if (typeof sourceValue !== 'string') return;

	if (prerenderImports.some((importItem) => sourceValue.includes(importItem))) {
		// @ts-expect-error - @types/estree seem to be wrong
		if (node.start && node.end) {
			constsToRemove.push(declarator.id.name);
			// @ts-expect-error - @types/estree seem to be wrong
			s.remove(node.start, node.end);
		}
	}
}
