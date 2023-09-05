import { t, visit } from './babel.js';
import type * as Babel from "@babel/types"

export function wrapDefaultExport(ast: Babel.File, functionIdentifier: Babel.Identifier) {
	visit(ast, {
		ExportDefaultDeclaration(path) {
			if (!t.isExpression(path.node.declaration)) return;
			if (
				t.isCallExpression(path.node.declaration) &&
				t.isIdentifier(path.node.declaration.callee) &&
				path.node.declaration.callee.name === functionIdentifier.name
			)
				return;
			path.node.declaration = t.callExpression(functionIdentifier, [path.node.declaration]);
		},
	});
}
