import { EXIT, SKIP, visit } from 'estree-util-visit';
import type { ArrowFunctionExpression, Program } from 'estree-jsx';

function isProgram(node: unknown): node is Program {
	return !!node && typeof node === 'object' && 'type' in node && (node as { type: string }).type === 'Program';
}

export function addAstroFragment() {
	return (tree: Program) => {
		tree.body.unshift({
			type: 'ImportDeclaration',
			specifiers: [
				{
					type: 'ImportSpecifier',
					imported: { type: 'Identifier', name: 'Fragment' },
					local: { type: 'Identifier', name: 'Fragment' },
				},
			],
			source: { type: 'Literal', value: 'astro/jsx-runtime' },
			attributes: [],
		} as any);

		const contentExport = {
			type: 'ExportNamedDeclaration',
			declaration: {
				type: 'VariableDeclaration',
				declarations: [
					{
						type: 'VariableDeclarator',
						id: { type: 'Identifier', name: 'Content' },
						init: {
							type: 'ArrowFunctionExpression',
							expression: true,
							generator: false,
							async: false,
							params: [
								{
									type: 'AssignmentPattern',
									left: { type: 'Identifier', name: 'props' },
									right: { type: 'ObjectExpression', properties: [] },
								},
							],
							body: {
								type: 'CallExpression',
								callee: { type: 'Identifier', name: 'OrgContent' },
								arguments: [
									{
										type: 'ObjectExpression',
										properties: [
											{ type: 'SpreadElement', argument: { type: 'Identifier', name: 'props' } },
											{
												type: 'Property',
												method: false,
												shorthand: false,
												computed: false,
												key: { type: 'Identifier', name: 'components' },
												value: {
													type: 'ObjectExpression',
													properties: [
														{
															type: 'Property',
															method: false,
															shorthand: true,
															computed: false,
															key: { type: 'Identifier', name: 'Fragment' },
															kind: 'init',
															value: { type: 'Identifier', name: 'Fragment' },
														},
														{
															type: 'SpreadElement',
															argument: {
																type: 'MemberExpression',
																object: { type: 'Identifier', name: 'props' },
																property: { type: 'Identifier', name: 'components' },
																computed: false,
																optional: false,
															},
														},
													],
												},
												kind: 'init',
											},
										],
									},
								],
								optional: false,
							},
						} as ArrowFunctionExpression,
					},
				],
				kind: 'const',
			},
			specifiers: [],
			attributes: [],
		} as const;

		visit(tree, (node, _key, index, ancestors) => {
			if (ancestors.length === 0 || index === undefined) return;

			const parent = ancestors[ancestors.length - 1];
			if (!isProgram(parent)) return SKIP;

			if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'Identifier') {
				(node.declaration as any).name = 'Content';
				parent.body.splice(index, 0, contentExport as unknown as Program['body'][number]);
				return EXIT;
			}
		});
	};
}
