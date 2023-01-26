import { type Expression, type Super } from 'estree';
import Slugger from 'github-slugger';
import { type MdxTextExpression } from 'mdast-util-mdx-expression';
import { visit, type Node } from 'unist-util-visit';

import { InvalidAstroDataError, safelyGetAstroData } from './frontmatter-injection.js';
import type { MarkdownAstroData, MarkdownHeading, MarkdownVFile, RehypePlugin } from './types.js';

const rawNodeTypes = new Set(['text', 'raw', 'mdxTextExpression']);
const codeTagNames = new Set(['code', 'pre']);

export function rehypeHeadingIds(): ReturnType<RehypePlugin> {
	return function (tree, file: MarkdownVFile) {
		const headings: MarkdownHeading[] = [];
		const slugger = new Slugger();
		const isMDX = isMDXFile(file);
		const astroData = safelyGetAstroData(file.data);
		visit(tree, (node) => {
			if (node.type !== 'element') return;
			const { tagName } = node;
			if (tagName[0] !== 'h') return;
			const [_, level] = tagName.match(/h([0-6])/) ?? [];
			if (!level) return;
			const depth = Number.parseInt(level);

			let text = '';
			visit(node, (child, __, parent) => {
				if (child.type === 'element' || parent == null) {
					return;
				}
				if (child.type === 'raw') {
					if (child.value.match(/^\n?<.*>\n?$/)) {
						return;
					}
				}
				if (rawNodeTypes.has(child.type)) {
					if (isMDX || codeTagNames.has(parent.tagName)) {
						let value = child.value;
						if (isMdxTextExpression(child) && !(astroData instanceof InvalidAstroDataError)) {
							const frontmatterPath = getMdxFrontmatterVariablePath(child);
							if (Array.isArray(frontmatterPath) && frontmatterPath.length > 0) {
								const frontmatterValue = getMdxFrontmatterVariableValue(astroData, frontmatterPath);
								if (typeof frontmatterValue === 'string') {
									value = frontmatterValue;
								}
							}
						}
						text += value;
					} else {
						text += child.value.replace(/\{/g, '${');
					}
				}
			});

			node.properties = node.properties || {};
			if (typeof node.properties.id !== 'string') {
				let slug = slugger.slug(text);

				if (slug.endsWith('-')) slug = slug.slice(0, -1);

				node.properties.id = slug;
			}

			headings.push({ depth, slug: node.properties.id, text });
		});

		file.data.__astroHeadings = headings;
	};
}

function isMDXFile(file: MarkdownVFile) {
	return Boolean(file.history[0]?.endsWith('.mdx'));
}

/**
 * Check if an ESTree entry is `frontmatter.*.VARIABLE`.
 * If it is, return the variable path (i.e. `["*", ..., "VARIABLE"]`) minus the `frontmatter` prefix.
 */
function getMdxFrontmatterVariablePath(node: MdxTextExpression): string[] | Error {
	if (!node.data?.estree || node.data.estree.body.length !== 1) return new Error();

	const statement = node.data.estree.body[0];

	// Check for "[ANYTHING].[ANYTHING]".
	if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'MemberExpression')
		return new Error();

	let expression: Expression | Super = statement.expression;
	const expressionPath: string[] = [];

	// Traverse the expression, collecting the variable path.
	while (
		expression.type === 'MemberExpression' &&
		expression.property.type === (expression.computed ? 'Literal' : 'Identifier')
	) {
		expressionPath.push(
			expression.property.type === 'Literal'
				? String(expression.property.value)
				: expression.property.name
		);

		expression = expression.object;
	}

	// Check for "frontmatter.[ANYTHING]".
	if (expression.type !== 'Identifier' || expression.name !== 'frontmatter') return new Error();

	return expressionPath.reverse();
}

function getMdxFrontmatterVariableValue(astroData: MarkdownAstroData, path: string[]) {
	let value: MdxFrontmatterVariableValue = astroData.frontmatter;

	for (const key of path) {
		if (!value[key]) return undefined;

		value = value[key];
	}

	return value;
}

function isMdxTextExpression(node: Node): node is MdxTextExpression {
	return node.type === 'mdxTextExpression';
}

type MdxFrontmatterVariableValue =
	MarkdownAstroData['frontmatter'][keyof MarkdownAstroData['frontmatter']];
