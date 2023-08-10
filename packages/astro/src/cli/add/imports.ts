import { t, visit } from './babel.js';

export function ensureImport(root: t.File, importDeclaration: t.ImportDeclaration) {
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

	visit(root, {
		Program(path) {
			const declaration = t.importDeclaration(specifiersToFind, importDeclaration.source);
			const latestImport = path
				.get('body')
				.filter((statement) => statement.isImportDeclaration())
				.pop();

			if (latestImport) latestImport.insertAfter(declaration);
			else path.unshiftContainer('body', declaration);
		},
	});
}
