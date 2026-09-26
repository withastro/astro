import { parse } from '@astrojs/compiler-rs';

interface ImportBinding {
	localName: string;
	specifier: string;
	namespace: boolean;
}

function getJsxName(node: Record<string, any>): string | undefined {
	if (node.type === 'JSXIdentifier') return node.name;
	if (node.type === 'JSXMemberExpression') {
		const object = getJsxName(node.object);
		const property = getJsxName(node.property);
		return object && property ? `${object}.${property}` : undefined;
	}
}

function hasClientDirective(attributes: Array<Record<string, any>>): boolean {
	return attributes.some(
		(attribute) =>
			attribute.type === 'JSXAttribute' &&
			attribute.name?.type === 'JSXIdentifier' &&
			attribute.name.name.startsWith('client:'),
	);
}

export function getNonHydratedComponentPaths(
	source: string,
	resolvePath: (specifier: string) => string,
): string[] {
	const { ast } = parse(source);
	const bindings: ImportBinding[] = [];

	for (const statement of ast.frontmatter?.program?.body ?? []) {
		if (statement.type !== 'ImportDeclaration' || typeof statement.source?.value !== 'string') {
			continue;
		}
		for (const specifier of statement.specifiers) {
			if (specifier.local?.name) {
				bindings.push({
					localName: specifier.local.name,
					specifier: statement.source.value,
					namespace: specifier.type === 'ImportNamespaceSpecifier',
				});
			}
		}
	}

	const paths = new Set<string>();
	const visit = (node: unknown) => {
		if (node == null || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const child of node) visit(child);
			return;
		}

		const record = node as Record<string, any>;
		if (record.type === 'JSXOpeningElement' && !hasClientDirective(record.attributes ?? [])) {
			const name = getJsxName(record.name);
			const binding = bindings.find(
				(candidate) =>
					name === candidate.localName ||
					(candidate.namespace && name?.startsWith(`${candidate.localName}.`)),
			);
			if (binding) paths.add(resolvePath(binding.specifier));
		}

		for (const value of Object.values(record)) visit(value);
	};
	visit(ast.body);

	return [...paths];
}
