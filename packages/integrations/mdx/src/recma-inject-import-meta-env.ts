import type { Literal, MemberExpression } from 'estree';
import { visit as estreeVisit } from 'estree-util-visit';

export function recmaInjectImportMetaEnv({
	importMetaEnv,
}: {
	importMetaEnv: Record<string, any>;
}) {
	return (tree: any) => {
		estreeVisit(tree, (node) => {
			if (node.type === 'MemberExpression') {
				// attempt to get "import.meta.env" variable name
				const envVarName = getImportMetaEnvVariableName(node);
				if (typeof envVarName === 'string') {
					// clear object keys to replace with envVarLiteral
					for (const key in node) {
						delete (node as any)[key];
					}
					const envVarLiteral: Literal = {
						type: 'Literal',
						value: importMetaEnv[envVarName],
						raw: JSON.stringify(importMetaEnv[envVarName]),
					};
					Object.assign(node, envVarLiteral);
				}
			}
		});
	};
}

/**
 * Check if estree entry is "import.meta.env.VARIABLE"
 * If it is, return the variable name (i.e. "VARIABLE")
 */
function getImportMetaEnvVariableName(node: MemberExpression): string | Error {
	try {
		// check for ".[ANYTHING]"
		if (node.object.type !== 'MemberExpression' || node.property.type !== 'Identifier')
			return new Error();

		const nestedExpression = node.object;
		// check for ".env"
		if (nestedExpression.property.type !== 'Identifier' || nestedExpression.property.name !== 'env')
			return new Error();

		const envExpression = nestedExpression.object;
		// check for ".meta"
		if (
			envExpression.type !== 'MetaProperty' ||
			envExpression.property.type !== 'Identifier' ||
			envExpression.property.name !== 'meta'
		)
			return new Error();

		// check for "import"
		if (envExpression.meta.name !== 'import') return new Error();

		return node.property.name;
	} catch (e) {
		if (e instanceof Error) {
			return e;
		}
		return new Error('Unknown parsing error');
	}
}
