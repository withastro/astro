import { t, visit } from './babel.js';

export function wrapDefaultExport(ast: t.File, functionIdentifier: t.Identifier) {
	visit(ast, {
		ExportDefaultDeclaration(path) {
			if (!t.isExpression(path.node.declaration)) return;
			if (t.isCallExpression(path.node.declaration) && t.isIdentifier(path.node.declaration.callee) && path.node.declaration.callee.name === functionIdentifier.name) return;
			path.node.declaration = t.callExpression(functionIdentifier, [path.node.declaration]);
		},
	});
}
