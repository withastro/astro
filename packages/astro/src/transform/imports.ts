import { t, visit } from './babel.js';

export function ensureImport(root: t.Program, importDeclaration: t.ImportDeclaration) {
	let specifiersToFind = [...importDeclaration.specifiers];

	visit(root, {
		ImportDeclaration(path) {
			if (path.node.source.value === importDeclaration.source.value) {
				path.node.specifiers.forEach((specifier) =>
					specifiersToFind.forEach((specifierToFind, i) => {
						if (specifier.type !== specifierToFind.type) return;
						if (specifier.local.name === specifierToFind.local.name) {
							specifiersToFind.splice(i, 1);
						}
					})
				);
			}
		},
	});

	if (specifiersToFind.length === 0) return;

	root.body.unshift(t.importDeclaration(specifiersToFind, importDeclaration.source));
}
